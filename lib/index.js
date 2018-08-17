'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const __assign = Object.assign || function (target) {
    for (var source, i = 1; i < arguments.length; i++) {
        source = arguments[i];
        for (var prop in source) {
            if (Object.prototype.hasOwnProperty.call(source, prop)) {
                target[prop] = source[prop];
            }
        }
    }
    return target;
};

/**
 * User Agent 정보를 파악합니다.
 *
 * 검색 커버리지를 포함하기 때문에, 검색에서 발생할 수 있는 이슈들을 처리하기 위해 검색쪽 모듈 코드를 사용합니다.
 */
/**
 * @param {object} ua 사용자 에이전트 정보 (navigator.useragent)
 */
function getInAppData(ua) {
    var matched = ua.match(/NAVER\((.+?)\)/);
    var isNaverApp = !!matched;
    var splited = (matched || ["", ""])[1].split("; ");
    return {
        isNaverApp: isNaverApp,
        // 브라우징에 사용하는 웹엔진을 나타내기 위한 값으로 inapp/higgs 두가지의 값이 가능하다. 'inapp' : os 기본 웹뷰, 'higgs' : 네이버 자체 웹뷰(Higgs 웹엔진)
        browserEngine: (splited[0] || ""),
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
var cachedAgent = null;
function getVersion(android, ios) {
    if (android !== null) {
        return parseFloat(android[1]);
    }
    else if (ios !== null) {
        return parseFloat(ios[2].replace("_", "."));
    }
    return;
}
/**
 * User Agent 정보를 파악합니다.
 * @return {AgentInfo}
 */
function getUserAgent() {
    if (cachedAgent !== null) {
        return cachedAgent;
    }
    var ua = window.navigator.userAgent;
    var android = ua.match(/Android ([\d|.]+)/);
    var ios = ua.match(/(iPhone )?OS ([\d|_]+)/);
    var version = getVersion(android, ios);
    var info = {
        os: {
            android: !!android,
            ios: !!ios,
            version: version
        },
        iPod: /iPod/.test(ua),
        iPhone: /iPhone/.test(ua),
        iPad: /iPad/.test(ua),
        inapp: getInAppData(ua),
        UIWebView: false
    };
    // WKWebView가 적용된 ios용 네앱의 브라우저 서비스 코드는 아이폰이 560, 아이패드가 134
    var isIPhoneLT550 = info.iPhone && parseInt(info.inapp.browserServiceCode, 10) < 560;
    var isIPadLT133 = info.iPad && parseInt(info.inapp.browserServiceCode, 10) < 134;
    info.UIWebView =
        info.os.ios && info.inapp.isNaverApp && (isIPhoneLT550 || isIPadLT133);
    cachedAgent = info;
    return info;
}

(function (AnimationStatus) {
    AnimationStatus["READY"] = "READY";
    AnimationStatus["IN_PROGRESS"] = "IN_PROGRESS";
    AnimationStatus["DONE"] = "DONE";
    AnimationStatus["REJECT"] = "REJECT";
})(exports.AnimationStatus || (exports.AnimationStatus = {}));
var defaultOption = {
    removeClassOnEnd: true,
    timeout: 1000
};
var animate = function (props) {
    var target = props.refinedTarget, className = props.className, option = props.option;
    var animationOption = __assign({}, defaultOption, option);
    var removeClassOnEnd = animationOption.removeClassOnEnd, timeout = animationOption.timeout;
    var animationStatus = exports.AnimationStatus.READY;
    var clearAnimates = function (onAnimationEnd) {
        target.removeEventListener("animationend", onAnimationEnd);
        requestAnimationFrame(function () { return removeClassOnEnd && target.classList.remove(className); });
    };
    return new Promise(function (resolve, reject) {
        var onAnimationEnd = function () {
            clearAnimates(onAnimationEnd);
            animationStatus = exports.AnimationStatus.DONE;
            return resolve({ animationStatus: animationStatus });
        };
        if (!isAnimationSupportDevice()) {
            animationStatus = exports.AnimationStatus.DONE;
            return onAnimationEnd();
        }
        target.addEventListener("animationend", onAnimationEnd);
        target.classList.add(className);
        animationStatus = exports.AnimationStatus.IN_PROGRESS;
        setTimeout(function () {
            if (animationStatus !== exports.AnimationStatus.DONE) {
                clearAnimates(onAnimationEnd);
                animationStatus = exports.AnimationStatus.REJECT;
                reject({ animationStatus: animationStatus });
            }
        }, timeout);
    });
};
var refineElement = function (target) {
    if (target instanceof HTMLElement) {
        return [target];
    }
    else if (Array.isArray(target)) {
        return target;
    }
};
/**
 * Public API
 * @param target animation target
 * @param className trigger CSS class
 * @param option animation trigger option
 */
var animates = function (target, className, option) {
    var promises = refineElement(target).map(function (refinedTarget) {
        return animate({
            refinedTarget: refinedTarget,
            className: className,
            option: option
        });
    });
    return Promise.all(promises);
};
function isAnimationSupportDevice() {
    var os = getUserAgent().os;
    return !(os.android && os.version < 5);
}

exports.animates = animates;
exports.isAnimationSupportDevice = isAnimationSupportDevice;
