/**
 * User Agent 정보를 파악합니다.
 *
 * 검색 커버리지를 포함하기 때문에, 검색에서 발생할 수 있는 이슈들을 처리하기 위해 검색쪽 모듈 코드를 사용합니다.
 */

export interface OSInfo {
  android: boolean;
  ios: boolean;
  version: number;
}

/**
 * inapp: os 기본 앱뷰,
 * higgs: 네이버 자체 웹뷰
 */
export type WebEngineType = "inapp" | "higgs";

export interface InAppInfo {
  isNaverApp: boolean;
  browserEngine: WebEngineType;
  serviceCode: string;
  browserServiceCode: string;
  serviceVersion: string;
  higgsEngineVersion: string;
}

export interface AgentInfo {
  os: OSInfo;
  iPod: boolean;
  iPhone: boolean;
  iPad: boolean;
  inapp: InAppInfo;
  UIWebView: boolean;
}

/**
 * @param {object} ua 사용자 에이전트 정보 (navigator.useragent)
 */
function getInAppData(ua: string): InAppInfo {
  const matched = ua.match(/NAVER\((.+?)\)/);
  const isNaverApp = !!matched;
  const splited = (matched || ["", ""])[1].split("; ");

  return {
    isNaverApp,

    // 브라우징에 사용하는 웹엔진을 나타내기 위한 값으로 inapp/higgs 두가지의 값이 가능하다. 'inapp' : os 기본 웹뷰, 'higgs' : 네이버 자체 웹뷰(Higgs 웹엔진)
    browserEngine: (splited[0] || "") as WebEngineType,

    // 소문자를사용하며, 여기에는 'search', 'navermap' 과 같이 인앱브라우저를 사용하는 서비스의 식별 값을 부여한다.
    serviceCode: splited[1] || "",

    // 기본적으로 모든 앱은 100번코드를 지정하며, 상세내용은 4장을 참고한다.
    browserServiceCode: splited[2] || "",

    // 사용앱의 버전을 의미하며, 서버에서 앱의 버전에 따른 별도의 처리가 필요할 경우 사용될 수 있다.
    serviceVersion: splited[3] || "",

    // 네이버 자체 웹뷰를 사용하는 경우만 존재한다. Higgs엔진의 버전 코드이다.
    higgsEngineVersion: splited[4] || ""
  };
}

/**
 * @type {AgentInfo}
 */
let cachedAgent: AgentInfo = null;

function getVersion(
  android: RegExpMatchArray,
  ios: RegExpMatchArray
): number | undefined {
  if (android !== null) {
    return parseFloat(android[1]);
  } else if (ios !== null) {
    return parseFloat(ios[2].replace("_", "."));
  }

  return;
}

/**
 * User Agent 정보를 파악합니다.
 * @return {AgentInfo}
 */
export function getUserAgent(): AgentInfo {
  if (cachedAgent !== null) {
    return cachedAgent;
  }

  const ua = window.navigator.userAgent;
  const android = ua.match(/Android ([\d|.]+)/);
  const ios = ua.match(/(iPhone )?OS ([\d|_]+)/);
  const version = getVersion(android, ios);
  const info: AgentInfo = {
    os: {
      android: !!android,
      ios: !!ios,
      version
    },
    iPod: /iPod/.test(ua),
    iPhone: /iPhone/.test(ua),
    iPad: /iPad/.test(ua),
    inapp: getInAppData(ua),
    UIWebView: false
  };

  // WKWebView가 적용된 ios용 네앱의 브라우저 서비스 코드는 아이폰이 560, 아이패드가 134
  const isIPhoneLT550: boolean =
    info.iPhone && parseInt(info.inapp.browserServiceCode, 10) < 560;
  const isIPadLT133: boolean =
    info.iPad && parseInt(info.inapp.browserServiceCode, 10) < 134;

  info.UIWebView =
    info.os.ios && info.inapp.isNaverApp && (isIPhoneLT550 || isIPadLT133);

  cachedAgent = info;
  return info;
}
