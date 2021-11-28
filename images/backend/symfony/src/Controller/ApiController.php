<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;


class ApiController extends AbstractController
{
  /**
   * @Route("/api/get_regions", name="api_get_regions")
   */
  public function get_regions(): Response
  {
    $entityManager = $this->getDoctrine()->getManager();

    $query = "SELECT jsonb_build_object(
    'type',     'FeatureCollection',
    'features', jsonb_agg(features.feature)
)
FROM (
  SELECT jsonb_build_object(
    'type',       'Feature',
    'id',         region_id,
    'geometry',   ST_AsGeoJSON(geom)::jsonb,
    'properties', to_jsonb(inputs) - 'gid' - 'geom'
  ) AS feature
  FROM (SELECT * FROM regions) inputs) features;";

$query = "SELECT jsonb_build_object(
    'type',     'FeatureCollection',
    'features', jsonb_agg(features.feature)
)
FROM (
  SELECT jsonb_build_object(
    'type',       'Feature',
    'id',         _regions.region_id,
    'geometry',   ST_AsGeoJSON(geom)::jsonb,
    'properties', to_jsonb(_regions) - 'gid' - 'geom'
  ) AS feature
FROM (SELECT * FROM regions) _regions
 JOIN (
 SELECT DISTINCT region_id FROM (WITH iprdh AS (SELECT DISTINCT region_id FROM incoming_per_region_dow_hour),
   mho AS ( SELECT DISTINCT origin AS region_id FROM mobility_hourly),
   mhd AS ( SELECT DISTINCT destination AS region_id FROM mobility_hourly),
   oprdh AS (SELECT DISTINCT region_id FROM outgoing_per_region_dow_hour) 
   SELECT region_id FROM mho UNION SELECT region_id FROM mhd UNION SELECT region_id FROM iprdh UNION SELECT region_id FROM oprdh) AS region_id_set
 ) region_id_set ON (_regions.region_id = region_id_set.region_id)
) features;";

    $statement = $entityManager->getConnection()->prepare($query);
    $statement->execute();

    $result = $statement->fetchAll();

    $response_data = [];
    if(isset($result[0]) && isset($result[0]['jsonb_build_object'])){
      $response_data = json_decode($result[0]['jsonb_build_object']);
    }

    return $this->json([
      'data' => $response_data,
      //'timestamp' => $params['timestamp'],
      //'result' => $result,
    ]);
  }


  public function checkParams(Request $request){
    $params = $request->query->all();
    // check for legal values to protect against SQL-injections
    if(!preg_match('/^[0-9,]*$/', $params['hours']) || strlen($params['hours']) > 61){
      error_log('1');
      return false;
    }

    $days_regex = '/^[0-6,]*$/';
    if(!preg_match($days_regex, $params['days']) || strlen($params['days']) > 13){
      error_log('2');
      return false;
    }

    $region_id_regex = '/^[0-9]*$/';
    if(isset($params['region_id']) && (!preg_match($region_id_regex, $params['region_id']) || strlen($params['region_id']) > 50)){
      error_log('3');
      return false;
    }

    return true;
  }

  /**
   * @Route("/api/get_incoming_regions", name="api_get_incoming_regions")
   */
  public function get_incoming_regions(Request $request): Response
  {
    $entityManager = $this->getDoctrine()->getManager();

    $params = $request->query->all();
    if(!$this->checkParams($request)){
      return $this->json([
        'success' => false,
        'msg' => 'Invalid/illegal parameter given.',
        'params' => $params,
      ]);
    }


    $query = "WITH all_regions_dow_hour AS (
	-- collect the itinerary counts, sum the mobility counts
	SELECT
		regions.region_id
		, regions.region_label
		, dows.dow
		, hours.hour
		, COALESCE(iprdh.count, 0) AS count_itineraries
		, COALESCE(sum(mobility_hourly.count), 0) AS count_mobility
		, geom
	FROM regions
	CROSS JOIN generate_series(0, 6) AS dows(dow)
	CROSS JOIN generate_series(0, 23) AS hours(hour)
	LEFT JOIN incoming_per_region_dow_hour iprdh ON
		iprdh.region_id = regions.region_id
		AND iprdh.dow = dows.dow
		AND iprdh.hour = hours.hour
	LEFT JOIN mobility_hourly ON
		mobility_hourly.destination = regions.region_id
		AND (mobility_hourly.wday = dows.dow OR (mobility_hourly.wday = 7 AND dows.dow = 0))  -- MARA mobility data has different DOW index for sunday
		AND mobility_hourly.origin_time = hours.hour
	WHERE
		dows.dow IN (" . $params['days'] . ")  -- QUERY PARAMETER, e. g. (4) or (0, 6) or (0,1,2,3,4,5,6)
		AND hours.hour IN (". $params['hours'] . ")  -- QUERY PARAMETER, e. g. (1) or (12,13,14,15)
	GROUP BY regions.region_id, regions.region_label, dows.dow, hours.hour, geom, iprdh.count  -- iprdh.count because that's singular already
)
, per_region AS (
	SELECT
		region_id,
		region_label,
		--array_agg(count_itineraries) AS debug_count_itineraries,
		sum(count_itineraries) AS count_itineraries,
		--array_agg(count_mobility) AS debug_count_mobility,
		sum(count_mobility) AS count_mobility,
		geom
	FROM all_regions_dow_hour
	GROUP BY region_id, region_label, geom
	HAVING NOT (sum(count_itineraries) = 0 AND sum(count_mobility) = 0)  -- skip unnecessary ones in output
	-- LIMIT 5  -- without a limit some clients (like DBeaver) might get overloaded with a very long geojson string, remove in production!
)
, geojson_features AS (
	SELECT
		region_id,
		json_build_object(
			'type', 'Feature',
      'id', region_id,
			'properties', json_build_object(
				'region', region_id,
				'region_label', region_label,
				'count_pt', count_itineraries,
				'count_mobility', count_mobility
			),
			'geometry', st_asgeojson(
				geom,
				6  -- maxdecimaldigits
			)::json
		) AS feature
	FROM per_region
)
SELECT
	json_build_object(
	    'type', 'FeatureCollection',
	    'features', json_agg(feature)
    )
FROM geojson_features;";

    $statement = $entityManager->getConnection()->prepare($query);
    $statement->execute();

    $result = $statement->fetchAll();

    $response_data = [];
    if(isset($result[0]) && isset($result[0]['json_build_object'])){
      $response_data = json_decode($result[0]['json_build_object']);
    }

    return $this->json([
      'success' => true,
      'data' => $response_data,
      'timestamp' => $params['timestamp'],
    ]);
  }

  /**
   * @Route("/api/get_outgoing_regions", name="api_get_outgoing_regions")
   */
  public function get_outgoing_regions(Request $request): Response
  {
    $entityManager = $this->getDoctrine()->getManager();

    $params = $request->query->all();
    if(!$this->checkParams($request)){
      return $this->json([
        'success' => false,
        'msg' => 'Invalid/illegal parameter given.',
        'params' => $params,
      ]);
    }

    $query = "WITH all_regions_dow_hour AS (
	-- collect the itinerary counts, sum the mobility counts
	SELECT
		regions.region_id
		, regions.region_label
		, dows.dow
		, hours.hour
		, COALESCE(oprdh.count, 0) AS count_itineraries
		, COALESCE(sum(mobility_hourly.count), 0) AS count_mobility
		, geom
	FROM regions
	CROSS JOIN generate_series(0, 6) AS dows(dow)
	CROSS JOIN generate_series(0, 23) AS hours(hour)
	LEFT JOIN outgoing_per_region_dow_hour oprdh ON
		oprdh.region_id = regions.region_id
		AND oprdh.dow = dows.dow
		AND oprdh.hour = hours.hour
	LEFT JOIN mobility_hourly ON
		mobility_hourly.origin = regions.region_id
		AND (mobility_hourly.wday = dows.dow OR (mobility_hourly.wday = 7 AND dows.dow = 0))  -- MARA mobility data has different DOW index for sunday
		AND mobility_hourly.origin_time = hours.hour
	WHERE
		dows.dow IN (" . $params['days'] . ")  -- QUERY PARAMETER, e. g. (4) or (0, 6) or (0,1,2,3,4,5,6)
		AND hours.hour IN (". $params['hours'] . ")  -- QUERY PARAMETER, e. g. (1) or (12,13,14,15)
	GROUP BY regions.region_id, regions.region_label, dows.dow, hours.hour, geom, oprdh.count  -- oprdh.count because that's singular already
)
, per_region AS (
	SELECT
		region_id,
		region_label,
		--array_agg(count_itineraries) AS debug_count_itineraries,
		sum(count_itineraries) AS count_itineraries,
		--array_agg(count_mobility) AS debug_count_mobility,
		sum(count_mobility) AS count_mobility,
		geom
	FROM all_regions_dow_hour
	GROUP BY region_id, region_label, geom
	HAVING NOT (sum(count_itineraries) = 0 AND sum(count_mobility) = 0)  -- skip unnecessary ones in output
	-- LIMIT 5  -- without a limit some clients (like DBeaver) might get overloaded with a very long geojson string, remove in production!
)
, geojson_features AS (
	SELECT
		region_id,
		json_build_object(
			'type', 'Feature',
      'id', region_id,
			'properties', json_build_object(
				'region', region_id,
				'region_label', region_label,
				'count_pt', count_itineraries,
				'count_mobility', count_mobility
			),
			'geometry', st_asgeojson(
				geom,
				6  -- maxdecimaldigits
			)::json
		) AS feature
	FROM per_region
)
SELECT
	json_build_object(
	    'type', 'FeatureCollection',
	    'features', json_agg(feature)
    )
FROM geojson_features;";

    $statement = $entityManager->getConnection()->prepare($query);
    $statement->execute();

    $result = $statement->fetchAll();

    $response_data = [];
    if(isset($result[0]) && isset($result[0]['json_build_object'])){
      $response_data = json_decode($result[0]['json_build_object']);
    }

    return $this->json([
      'success' => true,
      'data' => $response_data,
      'timestamp' => $params['timestamp'],
    ]);
  }

  /**
   * @Route("/api/get_outgoing_mobility", name="api_get_outgoing_mobility")
   */
  public function get_outgoing_mobility(Request $request): Response
  {
    $entityManager = $this->getDoctrine()->getManager();

    $params = $request->query->all();
    if(!$this->checkParams($request)){
      return $this->json([
        'success' => false,
        'msg' => 'Invalid/illegal parameter given.',
        'params' => $params,
      ]);
    }

    $query = "WITH region_to_others_dow_hour AS (
	-- collect the itinerary and mobility_hourly values
	SELECT
		regions_from.region_id AS from_region_id
		, regions_to.region_id AS to_region_id
		, regions_to.region_label AS to_region_label
		, regions_from.region_label AS from_region_label
		, regions_from.geom AS from_region_geom
		, regions_to.geom AS to_region_geom
		, dows.dow
		, hours.hour
		, COALESCE(siodhwn.count, 0) AS count_itineraries
		, COALESCE(mobility_hourly.count, 0) AS count_mobility
	FROM regions AS regions_from
	CROSS JOIN generate_series(0, 6) AS dows(dow)
	CROSS JOIN generate_series(0, 23) AS hours(hour)
	CROSS JOIN regions AS regions_to
	LEFT JOIN starting_in_origin_dow_hour_with_nonregional siodhwn ON
		siodhwn.from_region_id = regions_from.region_id
		AND siodhwn.to_region_id = regions_to.region_id
		AND siodhwn.dow = dows.dow
		AND siodhwn.hour = hours.hour
	LEFT JOIN mobility_hourly ON
		mobility_hourly.origin = regions_from.region_id
		AND mobility_hourly.destination = regions_to.region_id
		AND (mobility_hourly.wday = dows.dow OR (mobility_hourly.wday = 7 AND dows.dow = 0))  -- MARA mobility_hourly data has different DOW index for sunday
		AND mobility_hourly.origin_time = hours.hour
	WHERE
		regions_from.region_id = '" . $params['region_id'] . "' -- QUERY PARAMETER, e. g. '13076005'
		AND dows.dow IN (" . $params['days'] . ")  -- QUERY PARAMETER, e. g. (4) or (0, 6) or (0,1,2,3,4,5,6)
		AND hours.hour IN (". $params['hours'] . ")  -- QUERY PARAMETER, e. g. (1) or (12,13,14,15)
)
, per_region AS (
	SELECT
		from_region_id,
		from_region_label,
		to_region_id,
		to_region_label,
		--array_agg(count_itineraries) AS debug_count_itineraries,
		sum(count_itineraries) AS count_itineraries,
		--array_agg(count_mobility) AS debug_count_mobility,
		sum(count_mobility) AS count_mobility,
		ST_MakeLine(ST_PointOnSurface(from_region_geom), ST_PointOnSurface(to_region_geom)) AS geom
	FROM region_to_others_dow_hour
	WHERE from_region_id != to_region_id
	GROUP BY from_region_id, to_region_id, from_region_label, to_region_label, from_region_geom, to_region_geom
	HAVING NOT (sum(count_itineraries) = 0 AND sum(count_mobility) = 0)  -- skip unnecessary ones in output
	-- LIMIT 5  -- without a limit some clients (like DBeaver) might get overloaded with a very long geojson string, remove in production!
)
, geojson_features AS (
	SELECT
		from_region_id,
		json_build_object(
			'type', 'Feature',
      'id', CONCAT(from_region_id, to_region_id),
			'properties', json_build_object(
				'region_origin_id', from_region_id,
				'region_destination_id', to_region_id,
				'region_origin_label', from_region_label,
				'region_destination_label', to_region_label,
				'count_pt', count_itineraries,
				'count_mobility', count_mobility
			),
			'geometry', st_asgeojson(
				geom,
				6  -- maxdecimaldigits
			)::json
		) AS feature
	FROM per_region
)
SELECT
	json_build_object(
	    'type', 'FeatureCollection',
	    'features', json_agg(feature)
    )
FROM geojson_features;";

    $statement = $entityManager->getConnection()->prepare($query);
    $statement->execute();

    $result = $statement->fetchAll();

    $response_data = [];
    if(isset($result[0]) && isset($result[0]['json_build_object'])){
      $response_data = json_decode($result[0]['json_build_object']);
    }

    return $this->json([
      'success' => true,
      'data' => $response_data,
      'timestamp' => $params['timestamp'],
    ]);
  }

  /**
   * @Route("/api/get_incoming_mobility", name="api_get_incoming_mobility")
   */
  public function get_incoming_mobility(Request $request): Response
  {
    $entityManager = $this->getDoctrine()->getManager();

    $params = $request->query->all();
    if(!$this->checkParams($request)){
      return $this->json([
        'success' => false,
        'msg' => 'Invalid/illegal parameter given.',
        'params' => $params,
      ]);
    }

    $query = "WITH region_from_others_dow_hour AS (
	-- collect the itinerary and mobility_hourly values
	SELECT
		regions_from.region_id AS from_region_id
		, regions_to.region_id AS to_region_id
		, regions_to.region_label AS to_region_label
		, regions_from.region_label AS from_region_label
		, regions_from.geom AS from_region_geom
		, regions_to.geom AS to_region_geom
		, dows.dow
		, hours.hour
		, COALESCE(siodhwn.count, 0) AS count_itineraries
		, COALESCE(mobility_hourly.count, 0) AS count_mobility
	FROM regions AS regions_from
	CROSS JOIN generate_series(0, 6) AS dows(dow)
	CROSS JOIN generate_series(0, 23) AS hours(hour)
	CROSS JOIN regions AS regions_to
	LEFT JOIN starting_in_origin_dow_hour_with_nonregional siodhwn ON
		siodhwn.from_region_id = regions_from.region_id
		AND siodhwn.to_region_id = regions_to.region_id
		AND siodhwn.dow = dows.dow
		AND siodhwn.hour = hours.hour
	LEFT JOIN mobility_hourly ON
		mobility_hourly.origin = regions_from.region_id
		AND mobility_hourly.destination = regions_to.region_id
		AND (mobility_hourly.wday = dows.dow OR (mobility_hourly.wday = 7 AND dows.dow = 0))  -- MARA mobility_hourly data has different DOW index for sunday
		AND mobility_hourly.origin_time = hours.hour
	WHERE
		regions_to.region_id = '" . $params['region_id'] . "' -- QUERY PARAMETER, e. g. '13076005'
		AND dows.dow IN (" . $params['days'] . ")  -- QUERY PARAMETER, e. g. (4) or (0, 6) or (0,1,2,3,4,5,6)
		AND hours.hour IN (". $params['hours'] . ")  -- QUERY PARAMETER, e. g. (1) or (12,13,14,15)
)
, per_region AS (
	SELECT
		from_region_id,
		from_region_label,
		to_region_id,
		to_region_label,
		--array_agg(count_itineraries) AS debug_count_itineraries,
		sum(count_itineraries) AS count_itineraries,
		--array_agg(count_mobility) AS debug_count_mobility,
		sum(count_mobility) AS count_mobility,
		ST_MakeLine(ST_PointOnSurface(from_region_geom), ST_PointOnSurface(to_region_geom)) AS geom
	FROM region_from_others_dow_hour
	WHERE from_region_id != to_region_id
	GROUP BY from_region_id, to_region_id, from_region_label, to_region_label, from_region_geom, to_region_geom
	HAVING NOT (sum(count_itineraries) = 0 AND sum(count_mobility) = 0)  -- skip unnecessary ones in output
	-- LIMIT 5  -- without a limit some clients (like DBeaver) might get overloaded with a very long geojson string, remove in production!
)
, geojson_features AS (
	SELECT
		from_region_id,
		json_build_object(
			'type', 'Feature',
      'id', CONCAT(from_region_id, to_region_id),
			'properties', json_build_object(
				'region_origin_id', from_region_id,
				'region_destination_id', to_region_id,
				'region_origin_label', from_region_label,
				'region_destination_label', to_region_label,
				'count_pt', count_itineraries,
				'count_mobility', count_mobility
			),
			'geometry', st_asgeojson(
				geom,
				6  -- maxdecimaldigits
			)::json
		) AS feature
	FROM per_region
)
SELECT
	json_build_object(
	    'type', 'FeatureCollection',
	    'features', json_agg(feature)
    )
FROM geojson_features;";

    $statement = $entityManager->getConnection()->prepare($query);
    $statement->execute();

    $result = $statement->fetchAll();

    $response_data = [];
    if(isset($result[0]) && isset($result[0]['json_build_object'])){
      $response_data = json_decode($result[0]['json_build_object']);
    }

    return $this->json([
      'success' => true,
      'data' => $response_data,
      'timestamp' => $params['timestamp'],
    ]);
  }

}
