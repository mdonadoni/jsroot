import { gStyle, settings, constants, isBatchMode, getDocument } from '../core.mjs';

import { rgb as d3_rgb } from '../d3.mjs';

import { REVISION, DoubleSide,
         Object3D, Vector2, Vector3, Matrix4, Line3, Color, Plane, ShapeUtils,
         Scene, PointLight, PerspectiveCamera,
         Mesh, MeshBasicMaterial, MeshLambertMaterial, TextGeometry, SphereGeometry,
         LineSegments, LineBasicMaterial, LineDashedMaterial,
         BufferAttribute, BufferGeometry } from '../three.mjs';

import { floatToString, TRandom } from '../painter.mjs';

import { RAxisPainter } from '../gpad/RAxisPainter.mjs';

import { RFramePainter } from '../gpad/RFramePainter.mjs';

import { ensureRCanvas } from '../gpad/RCanvasPainter.mjs';

import { RH1Painter as RH1Painter2D } from '../hist2d/RH1Painter.mjs';

import { assign3DHandler, disposeThreejsObject, createOrbitControl,
         createLineSegments, create3DLineMaterial, PointsCreator, Box3D,
         createRender3D, beforeRender3D, afterRender3D, getRender3DKind,
         cleanupRender3D, HelveticerRegularFont, createSVGRenderer } from '../base3d.mjs';

import { translateLaTeX } from '../latex.mjs';

class RH1Painter extends RH1Painter2D {

   /** @summary Draw 1-D histogram in 3D mode */
   async draw3D(reason) {

      this.mode3d = true;

      let main = this.getFramePainter(), // who makes axis drawing
          is_main = this.isMainPainter(); // is main histogram

      if (reason == "resize")  {
         if (is_main && main.resize3D()) main.render3D();
         return this;
      }

      this.deleteAttr();

      this.scanContent(true); // may be required for axis drawings

      if (is_main) {
         await main.create3DScene(this.options.Render3D);
         main.setAxesRanges(this.getAxis("x"), this.xmin, this.xmax, null, this.ymin, this.ymax, null, 0, 0);
         main.set3DOptions(this.options);
         main.drawXYZ(main.toplevel, { use_y_for_z: true, zmult: 1.1, zoom: settings.Zooming, ndim: 1 });
      }

      if (main.mode3d) {
         await this.drawingBins(reason);

         // called when bins received from server, must be reentrant
         let main = this.getFramePainter();

         this.drawLego();
         this.updatePaletteDraw();
         main.render3D();
         main.addKeysHandler();
      }

      return this;
   }

} // class RH1Painter

export { RH1Painter };

