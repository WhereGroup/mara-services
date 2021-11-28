import MaraApp from "./components/MaraApp";
import { AppContextProvider } from "./components/AppContext";
import { MapComponentsProvider } from "@mapcomponents/react-core";

function App() {
  return (
    <MapComponentsProvider>
      <AppContextProvider>
        <div className="map">
          <MaraApp />
        </div>
      </AppContextProvider>
    </MapComponentsProvider>
  );
}

export default App;
