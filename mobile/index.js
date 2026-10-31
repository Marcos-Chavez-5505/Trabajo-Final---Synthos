import { registerRootComponent } from "expo";

//* PARA TESTING DE COMPONENTES
//* import testPage from "./pages/test/{componente o pagina a testear}"

import { initApi } from "./config/api";

initApi();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately

import App from "./App";

registerRootComponent(App);
