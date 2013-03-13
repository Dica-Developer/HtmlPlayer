(function(d) {
  +"use strict";
  var n = "left",
    m = "right",
    c = "up",
    u = "down",
    b = "in",
    v = "out",
    k = "none",
    q = "auto",
    j = "swipe",
    r = "pinch",
    e = "click",
    x = "horizontal",
    s = "vertical",
    h = "all",
    f = "start",
    i = "move",
    g = "end",
    o = "cancel",
    a = "ontouchstart" in window,
    w = "TouchSwipe";
  var l = {
    fingers: 1,
    threshold: 75,
    pinchThreshold: 20,
    maxTimeThreshold: null,
    fingerReleaseThreshold: 250,
    swipe: null,
    swipeLeft: null,
    swipeRight: null,
    swipeUp: null,
    swipeDown: null,
    swipeStatus: null,
    pinchIn: null,
    pinchOut: null,
    pinchStatus: null,
    click: null,
    triggerOnTouchEnd: true,
    triggerOnTouchLeave: false,
    allowPageScroll: "auto",
    fallbackToMouseEvents: true,
    excludedElements: "button, input, select, textarea, a, .noSwipe"
  };
  d.fn.swipe = function(A) {
    var z = d(this),
      y = z.data(w);
    if (y && typeof A === "string") {
      if (y[A]) {
        return y[A].apply(this, Array.prototype.slice.call(arguments, 1))
      } else {
        d.error("Method " + A + " does not exist on jQuery.swipe")
      }
    } else {
      if (!y && (typeof A === "object" || !A)) {
        return t.apply(this, arguments)
      }
    }
    return z
  };
  d.fn.swipe.defaults = l;
  d.fn.swipe.phases = {
    PHASE_START: f,
    PHASE_MOVE: i,
    PHASE_END: g,
    PHASE_CANCEL: o
  };
  d.fn.swipe.directions = {
    LEFT: n,
    RIGHT: m,
    UP: c,
    DOWN: u,
    IN: b,
    OUT: v
  };
  d.fn.swipe.pageScroll = {
    NONE: k,
    HORIZONTAL: x,
    VERTICAL: s,
    AUTO: q
  };
  d.fn.swipe.fingers = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    ALL: h
  };

  function t(y) {
    if (y && (y.allowPageScroll === undefined && (y.swipe !== undefined || y.swipeStatus !== undefined))) {
      y.allowPageScroll = k
    }
    if (!y) {
      y = {}
    }
    y = d.extend({}, d.fn.swipe.defaults, y);
    return this.each(function() {
      var A = d(this);
      var z = A.data(w);
      if (!z) {
        z = new p(this, y);
        A.data(w, z)
      }
    })
  }
  function p(S, af) {
    var aF = (a || !af.fallbackToMouseEvents),
      ax = aF ? "touchstart" : "mousedown",
      U = aF ? "touchmove" : "mousemove",
      au = aF ? "touchend" : "mouseup",
      D = aF ? null : "mouseleave",
      R = "touchcancel";
    var ac = 0;
    var N = null;
    var ag = 0;
    var aB = 0;
    var A = 0;
    var ai = 1;
    var aH = 0;
    var H = d(S);
    var O = "start";
    var aE = 0;
    var ah = null;
    var I = 0;
    var Y = 0;
    var aA = 0;
    var aJ = 0;
    try {
      H.bind(ax, ar);
      H.bind(R, M)
    } catch (aC) {
      d.error("events not supported " + ax + "," + R + " on jQuery.swipe")
    }
    this.enable = function() {
      H.bind(ax, ar);
      H.bind(R, M);
      return H
    };
    this.disable = function() {
      Q();
      return H
    };
    this.destroy = function() {
      Q();
      H.data(w, null);
      return H
    };

    function ar(aM) {
      if (X()) {
        return
      }
      if (d(aM.target).closest(af.excludedElements, H).length > 0) {
        return
      }
      var aN = aM.originalEvent;
      var aL, aK = a ? aN.touches[0] : aN;
      O = f;
      if (a) {
        aE = aN.touches.length
      } else {
        aM.preventDefault()
      }
      ac = 0;
      N = null;
      aH = null;
      ag = 0;
      aB = 0;
      A = 0;
      ai = 1;
      pinchDistance = 0;
      ah = T();
      z();
      if (!a || (aE === af.fingers || af.fingers === h) || ao()) {
        aI(0, aK);
        I = B();
        if (aE == 2) {
          aI(1, aN.touches[1]);
          aB = A = Z(ah[0].start, ah[1].start)
        }
        if (af.swipeStatus || af.pinchStatus) {
          aL = aD(aN, O)
        }
      } else {
        aL = false
      }
      if (aL === false) {
        O = o;
        aD(aN, O);
        return aL
      } else {
        aj(true)
      }
    }
    function P(aN) {
      var aQ = aN.originalEvent;
      if (O === g || O === o || ae()) {
        return
      }
      var aM, aL = a ? aQ.touches[0] : aQ;
      var aO = V(aL);
      Y = B();
      if (a) {
        aE = aQ.touches.length
      }
      O = i;
      if (aE == 2) {
        if (aB == 0) {
          aI(1, aQ.touches[1]);
          aB = A = Z(ah[0].start, ah[1].start)
        } else {
          V(aQ.touches[1]);
          A = Z(ah[0].end, ah[1].end);
          aH = an(ah[0].end, ah[1].end)
        }
        ai = y(aB, A);
        pinchDistance = Math.abs(aB - A)
      }
      if ((aE === af.fingers || af.fingers === h) || !a || ao()) {
        N = aq(aO.start, aO.end);
        C(aN, N);
        ac = G(aO.start, aO.end);
        ag = L();
        if (af.swipeStatus || af.pinchStatus) {
          aM = aD(aQ, O)
        }
        if (!af.triggerOnTouchEnd || af.triggerOnTouchLeave) {
          var aK = true;
          if (af.triggerOnTouchLeave) {
            var aP = at(this);
            aK = az(aO.end, aP)
          }
          if (!af.triggerOnTouchEnd && aK) {
            O = aG(i)
          } else {
            if (af.triggerOnTouchLeave && !aK) {
              O = aG(g)
            }
          }
          if (O == o || O == g) {
            aD(aQ, O)
          }
        }
      } else {
        O = o;
        aD(aQ, O)
      }
      if (aM === false) {
        O = o;
        aD(aQ, O)
      }
    }
    function aa(aM) {
      var aO = aM.originalEvent;
      if (a) {
        if (aO.touches.length > 0) {
          av();
          return true
        }
      }
      if (ae()) {
        aE = aJ
      }
      aM.preventDefault();
      Y = B();
      if (af.triggerOnTouchEnd || (af.triggerOnTouchEnd == false && O === i)) {
        O = g;
        var aL = ((aE === af.fingers || af.fingers === h) || !a);
        var aK = ah[0].end.x !== 0;
        var aN = aL && aK && (am() || ay());
        if (aN) {
          aD(aO, O)
        } else {
          O = o;
          aD(aO, O)
        }
      } else {
        if (O === i) {
          O = o;
          aD(aO, O)
        }
      }
      aj(false)
    }
    function M() {
      aE = 0;
      Y = 0;
      I = 0;
      aB = 0;
      A = 0;
      ai = 1;
      z();
      aj(false)
    }
    function W(aK) {
      var aL = aK.originalEvent;
      if (af.triggerOnTouchLeave) {
        O = aG(g);
        aD(aL, O)
      }
    }
    function Q() {
      H.unbind(ax, ar);
      H.unbind(R, M);
      H.unbind(U, P);
      H.unbind(au, aa);
      if (D) {
        H.unbind(D, W)
      }
      aj(false)
    }
    function aG(aN) {
      var aM = aN;
      var aL = ap();
      var aK = ad();
      if (!aL) {
        aM = o
      } else {
        if (aK && aN == i && (!af.triggerOnTouchEnd || af.triggerOnTouchLeave)) {
          aM = g
        } else {
          if (!aK && aN == g && af.triggerOnTouchLeave) {
            aM = o
          }
        }
      }
      return aM
    }
    function aD(aM, aK) {
      var aL = undefined;
      if (ab()) {
        aL = al(aM, aK, j)
      }
      if (ao() && aL !== false) {
        aL = al(aM, aK, r)
      }
      if (K() && aL !== false) {
        aL = al(aM, aK, e)
      }
      if (aK === o) {
        M(aM)
      }
      if (aK === g) {
        if (a) {
          if (aM.touches.length == 0) {
            M(aM)
          }
        } else {
          M(aM)
        }
      }
      return aL
    }
    function al(aN, aK, aM) {
      var aL = undefined;
      if (aM == j) {
        if (af.swipeStatus) {
          aL = af.swipeStatus.call(H, aN, aK, N || null, ac || 0, ag || 0, aE);
          if (aL === false) {
            return false
          }
        }
        if (aK == g && ay()) {
          if (af.swipe) {
            aL = af.swipe.call(H, aN, N, ac, ag, aE);
            if (aL === false) {
              return false
            }
          }
          switch (N) {
            case n:
              if (af.swipeLeft) {
                aL = af.swipeLeft.call(H, aN, N, ac, ag, aE)
              }
              break;
            case m:
              if (af.swipeRight) {
                aL = af.swipeRight.call(H, aN, N, ac, ag, aE)
              }
              break;
            case c:
              if (af.swipeUp) {
                aL = af.swipeUp.call(H, aN, N, ac, ag, aE)
              }
              break;
            case u:
              if (af.swipeDown) {
                aL = af.swipeDown.call(H, aN, N, ac, ag, aE)
              }
              break
          }
        }
      }
      if (aM == r) {
        if (af.pinchStatus) {
          aL = af.pinchStatus.call(H, aN, aK, aH || null, pinchDistance || 0, ag || 0, aE, ai);
          if (aL === false) {
            return false
          }
        }
        if (aK == g && am()) {
          switch (aH) {
            case b:
              if (af.pinchIn) {
                aL = af.pinchIn.call(H, aN, aH || null, pinchDistance || 0, ag || 0, aE, ai)
              }
              break;
            case v:
              if (af.pinchOut) {
                aL = af.pinchOut.call(H, aN, aH || null, pinchDistance || 0, ag || 0, aE, ai)
              }
              break
          }
        }
      }
      if (aM == e) {
        if (aK === o) {
          if (af.click && (aE === 1 || !a) && (isNaN(ac) || ac === 0)) {
            aL = af.click.call(H, aN, aN.target)
          }
        }
      }
      return aL
    }
    function ad() {
      if (af.threshold !== null) {
        return ac >= af.threshold
      }
      return true
    }
    function ak() {
      if (af.pinchThreshold !== null) {
        return pinchDistance >= af.pinchThreshold
      }
      return true
    }
    function ap() {
      var aK;
      if (af.maxTimeThreshold) {
        if (ag >= af.maxTimeThreshold) {
          aK = false
        } else {
          aK = true
        }
      } else {
        aK = true
      }
      return aK
    }
    function C(aK, aL) {
      if (af.allowPageScroll === k || ao()) {
        aK.preventDefault()
      } else {
        var aM = af.allowPageScroll === q;
        switch (aL) {
          case n:
            if ((af.swipeLeft && aM) || (!aM && af.allowPageScroll != x)) {
              aK.preventDefault()
            }
            break;
          case m:
            if ((af.swipeRight && aM) || (!aM && af.allowPageScroll != x)) {
              aK.preventDefault()
            }
            break;
          case c:
            if ((af.swipeUp && aM) || (!aM && af.allowPageScroll != s)) {
              aK.preventDefault()
            }
            break;
          case u:
            if ((af.swipeDown && aM) || (!aM && af.allowPageScroll != s)) {
              aK.preventDefault()
            }
            break
        }
      }
    }
    function am() {
      return ak()
    }
    function ao() {
      return !!(af.pinchStatus || af.pinchIn || af.pinchOut)
    }
    function aw() {
      return !!(am() && ao())
    }
    function ay() {
      var aK = ap();
      var aM = ad();
      var aL = aM && aK;
      return aL
    }
    function ab() {
      return !!(af.swipe || af.swipeStatus || af.swipeLeft || af.swipeRight || af.swipeUp || af.swipeDown)
    }
    function E() {
      return !!(ay() && ab())
    }
    function K() {
      return !!(af.click)
    }
    function av() {
      aA = B();
      aJ = event.touches.length + 1
    }
    function z() {
      aA = 0;
      aJ = 0
    }
    function ae() {
      var aK = false;
      if (aA) {
        var aL = B() - aA;
        if (aL <= af.fingerReleaseThreshold) {
          aK = true
        }
      }
      return aK
    }
    function X() {
      return !!(H.data(w + "_intouch") === true)
    }
    function aj(aK) {
      if (aK === true) {
        H.bind(U, P);
        H.bind(au, aa);
        if (D) {
          H.bind(D, W)
        }
      } else {
        H.unbind(U, P, false);
        H.unbind(au, aa, false);
        if (D) {
          H.unbind(D, W, false)
        }
      }
      H.data(w + "_intouch", aK === true)
    }
    function aI(aL, aK) {
      var aM = aK.identifier !== undefined ? aK.identifier : 0;
      ah[aL].identifier = aM;
      ah[aL].start.x = ah[aL].end.x = aK.pageX || aK.clientX;
      ah[aL].start.y = ah[aL].end.y = aK.pageY || aK.clientY;
      return ah[aL]
    }
    function V(aK) {
      var aM = aK.identifier !== undefined ? aK.identifier : 0;
      var aL = J(aM);
      aL.end.x = aK.pageX || aK.clientX;
      aL.end.y = aK.pageY || aK.clientY;
      return aL
    }
    function J(aL) {
      for (var aK = 0; aK < ah.length; aK++) {
        if (ah[aK].identifier == aL) {
          return ah[aK]
        }
      }
    }
    function T() {
      var aK = [];
      for (var aL = 0; aL <= 5; aL++) {
        aK.push({
          start: {
            x: 0,
            y: 0
          },
          end: {
            x: 0,
            y: 0
          },
          identifier: 0
        })
      }
      return aK
    }
    function L() {
      return Y - I
    }
    function Z(aN, aM) {
      var aL = Math.abs(aN.x - aM.x);
      var aK = Math.abs(aN.y - aM.y);
      return Math.round(Math.sqrt(aL * aL + aK * aK))
    }
    function y(aK, aL) {
      var aM = (aL / aK) * 1;
      return aM.toFixed(2)
    }
    function an() {
      if (ai < 1) {
        return v
      } else {
        return b
      }
    }
    function G(aL, aK) {
      return Math.round(Math.sqrt(Math.pow(aK.x - aL.x, 2) + Math.pow(aK.y - aL.y, 2)))
    }
    function F(aN, aL) {
      var aK = aN.x - aL.x;
      var aP = aL.y - aN.y;
      var aM = Math.atan2(aP, aK);
      var aO = Math.round(aM * 180 / Math.PI);
      if (aO < 0) {
        aO = 360 - Math.abs(aO)
      }
      return aO
    }
    function aq(aL, aK) {
      var aM = F(aL, aK);
      if ((aM <= 45) && (aM >= 0)) {
        return n
      } else {
        if ((aM <= 360) && (aM >= 315)) {
          return n
        } else {
          if ((aM >= 135) && (aM <= 225)) {
            return m
          } else {
            if ((aM > 45) && (aM < 135)) {
              return u
            } else {
              return c
            }
          }
        }
      }
    }
    function B() {
      var aK = new Date();
      return aK.getTime()
    }
    function at(aK) {
      aK = d(aK);
      var aM = aK.offset();
      var aL = {
        left: aM.left,
        right: aM.left + aK.outerWidth(),
        top: aM.top,
        bottom: aM.top + aK.outerHeight()
      };
      return aL
    }
    function az(aK, aL) {
      return (aK.x > aL.left && aK.x < aL.right && aK.y > aL.top && aK.y < aL.bottom)
    }
  }
})(jQuery);