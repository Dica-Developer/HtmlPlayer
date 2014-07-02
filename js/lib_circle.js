/*global Hammer*/
(function(name) {
  'use strict';

  var triggered = false;

  var prevEvent = null;

  function circleGesture(ev, inst) {
    switch (ev.eventType) {
      case Hammer.EVENT_START:
        triggered = false;
        break;

      case Hammer.EVENT_MOVE:
        if (ev.touches.length !== 1) {
          return;
        }

        var rotationSpeed = 0;
        if (null !== prevEvent) {
          var deltaTime = ev.timeStamp - prevEvent.timeStamp;
          var deltaAngle = ev.angle - prevEvent.angle;
          rotationSpeed = (deltaAngle / deltaTime);
        }
        prevEvent = ev;
        if (Math.abs(rotationSpeed) >= inst.options.circleMinRotation) {
          if (!triggered) {
            triggered = true;
          }
          ev.rotationSpeed = rotationSpeed;
          inst.trigger('circle', ev);
        }
        break;
      case Hammer.EVENT_RELEASE:
        if (triggered && ev.changedLength < 2) {
          inst.trigger(name + 'end', ev);
          triggered = false;
        }
        break;
    }
  }

  Hammer.gestures.Circle = {
    name: 'circle',
    index: 2000,
    defaults: {
      circleMinRotation: 0.08
    },
    handler: circleGesture
  };
})('circle');
