import { registerRootComponent } from "expo";

// import App from './App';
import Login from "./pages/login/Login";
//* Si quieren probarlo comenten el import de login, descomenten el de register y
//* pongan registerRootComponent(Register)
// import Register from "./pages/register/Register";
import { initApi } from "./config/api";

initApi();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
import App from "./App";

registerRootComponent(App);
