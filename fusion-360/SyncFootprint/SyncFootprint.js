// TODO draw curves marked for construction on silkscreen

var MILS_IN_CM = 393.700787; // According to Google

function expandRectangle(rect, pt) {
  var left = rect.left;
  var top = rect.top;
  var right = rect.right;
  var bottom = rect.bottom;

  if (left === undefined || pt.x < left) {
    left = pt.x;
  }

  if (right === undefined || pt.x > right) {
    right = pt.x;
  }

  if (top === undefined || pt.y < top) {
    top = pt.y;
  }

  if (bottom === undefined || pt.y > bottom) {
    bottom = pt.y;
  }

  return { left, top, right, bottom };
}

function findRectangles(sketch) {
  var rectangles = [];

  var lines = sketch.sketchCurves.sketchLines;

  for (var i = 0; i < lines.count; i += 1) {
    var line = lines.item(i);

    if (line === undefined || line === null) {
      console.log('Problem');
    }

    if (!line.isConstruction) {
      var connected = sketch.findConnectedCurves(line);

      if (connected === undefined || connected === null) {
        console.log('Problem');
      }

      // TODO check that opposite sides are parallel
      if (connected.count === 4) {
        var rect = {};

        for (var j = 0; j < connected.count; j += 1) {
          var rectLine = connected.item(j);
          var start = rectLine.startSketchPoint.geometry;
          var end = rectLine.endSketchPoint.geometry;

          if (start === undefined || start === null || end === undefined || end === null) {
            console.log('Problem');
          }

          rect = expandRectangle(rect, start);
          rect = expandRectangle(rect, end);
        }

        var width = rect.right - rect.left;
        var height = rect.bottom - rect.top;

        rectangles.push({
          left: rect.left,
          top: rect.top,
          width: width,
          height: height,
        });
      }
    }
  }

  return rectangles;
}

function run(context) {
    "use strict";

    if (adsk.debug === true) {
        /*jslint debug: true*/
        debugger;
        /*jslint debug: false*/
    }

    var ui;
    try {
        var app = adsk.core.Application.get();
        var ui = app.userInterface;

        var processed = adsk.core.ObjectCollection.create();

        var sketch = app.activeEditObject;

        if (sketch.handle.objectType !== 'adsk.fusion.Sketch') {
          ui.messageBox('A sketch needs to be active to run this command.');
          return;
        }

        var rectangles = findRectangles(sketch);

        var csv = '';
        for (var i = 0; i < rectangles.length; i += 4) { // HACK skipping rects
          var r = rectangles[i];

          var cx = r.left + r.width / 2;
          var cy = r.top + r.height / 2;

          csv += (MILS_IN_CM * r.width) + ',' +
            (MILS_IN_CM * r.height) + ',' +
            (MILS_IN_CM * cx) + ',' +
            (MILS_IN_CM * cy) + '\n';
        }

        var filename = '/tmp/rectangles.csv';
        adsk.writeFile(filename, csv);

        ui.messageBox('Wrote rectangles to ' + filename);
    } catch (e) {
        if (ui) {
            ui.messageBox('Failed : ' + (e.description ? e.description : e));
        }
    }

    adsk.terminate();
}
