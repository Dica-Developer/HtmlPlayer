(function(name) {
  var triggered = false;

  function circleGesture(ev, inst) {
    switch (ev.eventType) {
      case Hammer.EVENT_START:
        triggered = false;
        break;

      case Hammer.EVENT_MOVE:
        if (ev.touches.length !== 1) {
          return;
        }

        var rotationThreshold = Math.abs(ev.rotation);
        if (rotationThreshold < inst.options.circleMinRotation) {
          return;
        }

        // we are transforming!
        Detection.current.name = name;

        // first time, trigger dragstart event
        if (!triggered) {
          inst.trigger(name + 'start', ev);
          triggered = true;
        }

        inst.trigger(name, ev); // basic transform event

        if (rotationThreshold > inst.options.circleMinRotation) {
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
      circleMinRotation: 1
    },
    handler: circleGesture
  };
})('circle');
