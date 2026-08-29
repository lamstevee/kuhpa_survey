import { registerRootComponent } from "expo";

// 지오펜스 태스크는 UI보다 먼저 등록돼야 한다. OS가 화면 없이 앱을 깨우는 경우
// registerRootComponent 이후의 코드는 실행되지 않을 수 있다.
import "./src/lib/geofence";

import App from "./App";

registerRootComponent(App);
