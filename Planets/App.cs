using System;
using Bridge.Html5;

namespace Planets
{
    public class App
    {
		static HTMLDivElement container;
		static HTMLCanvasElement canvas;

		static int startPlanets;
		static double timLimitScale;
		static double timeScale;
		static double gScale;
		static double newPlanetSpeedScale;

        [Ready]
        public static void Main()
        {
			getContainerProperties();

			setupCanvas();

			Sky sky = new Sky(container.ClientWidth, container.ClientHeight, timLimitScale, gScale, newPlanetSpeedScale, timeScale);

			//Add a bunch of new planets at random places
			sky.addRandomPlanets(startPlanets);

			//Register resize listener
			/*
			Window.OnResize = (e) =>
			{
				canvas.Width = container.ClientWidth;
				canvas.Height = container.ClientHeight;
				sky.xSize = canvas.Width;
				sky.ySize = canvas.Height;
			};
			*/

			//Capture the rendering context for the sky
			CanvasRenderingContext2D ctx = (CanvasRenderingContext2D)canvas.GetContext("2d");

			double timestamp = Global.Performance.Now();

			Window.RequestAnimationFrame((t) => {
				renderFrame(sky, ctx, t, timestamp, true);
			});

		}

		public static void getContainerProperties() {
			container = (HTMLDivElement)Document.GetElementById("planets-container");
			container.Style.Margin = "0px";

			String startPlanetsStr = container.GetAttribute("data-startPlanets");
			String timLimitScaleStr = container.GetAttribute("data-timLimitScale");
			String timeScaleStr = container.GetAttribute("data-timeScale");
			String gScaleStr = container.GetAttribute("data-gScale");
			String newPlanetSpeedScaleStr = container.GetAttribute("data-newPlanetSpeedScale");

			int startPlanets = 0;
			if (!int.TryParse(startPlanetsStr, out startPlanets)) {
				startPlanets = Sky.DEFAULT_START_PLANETS;
			}
			App.startPlanets = startPlanets;

			double timLimitScale = 0;
			if (!double.TryParse(timLimitScaleStr, out timLimitScale)) {
				timLimitScale = 1;
			}
			App.timLimitScale = timLimitScale;

			double timeScale = 0;
			if (!double.TryParse(timeScaleStr, out timeScale))
			{
				timeScale = 1;
			}
			App.timeScale = timeScale;

			double gScale = 0;
			if (!double.TryParse(gScaleStr, out gScale))
			{
				gScale = 1;
			}
			App.gScale = gScale;

			double newPlanetSpeedScale = 0;
			if (!double.TryParse(newPlanetSpeedScaleStr, out newPlanetSpeedScale))
			{
				newPlanetSpeedScale = 1;
			}
			App.newPlanetSpeedScale = newPlanetSpeedScale;
		}

		public static void setupCanvas() {
			canvas = (HTMLCanvasElement)Document.CreateElement("canvas");
			canvas.Id = "planet_canvas";
			canvas.Width = container.ClientWidth;
			canvas.Height = container.ClientHeight;
			canvas.Style.Width = "100%";
			canvas.Style.Height = "100%";
			canvas.Style.BackgroundColor = "transparent";
			canvas.Style.Display = Display.Block;

			//Append the sky to the body of the page
			Document.Body.Style.Margin = "0px";
			//Document.Body.AppendChild(canvas);
			container.AppendChild(canvas);
		}

		public static void renderFrame(Sky sky, CanvasRenderingContext2D ctx, double currenttime, double prevtime, bool recalc) {
			double elapsedTime = currenttime - prevtime;
			elapsedTime %= 100;

			sky.move (elapsedTime);
			redrawSky (ctx, sky);

			if (recalc) {
				sky.recalculateGravity (elapsedTime);
			}

			Window.RequestAnimationFrame((t) => {
				renderFrame(sky, ctx, t, currenttime, !recalc);
			});
		}

		public static void redrawSky(CanvasRenderingContext2D ctx, Sky sky) {
			ctx.ClearRect(0, 0, sky.xSize, sky.ySize);
			ctx.FillStyle = HTMLColor.White;

			if (canvas.Width != container.ClientWidth || canvas.Height != container.ClientHeight) {
				canvas.Width = container.ClientWidth;
				canvas.Height = container.ClientHeight;
				sky.xSize = canvas.Width;
				sky.ySize = canvas.Height;
			}

			for(int i=0; i<sky.planets.Count; i++) {
				Planet planet = sky.planets.Get (i);
				ctx.BeginPath();
				ctx.Arc(planet.x,planet.y,planet.radius,0,2*Math.PI);
				ctx.ClosePath();
				ctx.Fill();
			}
		}
    }
}
