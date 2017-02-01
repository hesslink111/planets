using System;

namespace Planets
{
	public class Planet
	{

		public static long count;
		public long id;

		public double x, y, size, xVel, yVel;
		public double futureXVel,futureYVel;
		public double radius;

		public bool remove;

		public Planet (double x, double y, double size, double xVel, double yVel)
		{
			this.id = Planet.count;
			Planet.count++;

			this.x = x;
			this.y = y;
			this.size = size;
			this.xVel = xVel;
			this.yVel = yVel;

			futureXVel = xVel;
			futureYVel = yVel;

			radius = 2 * Math.Sqrt(size / 1000 / Math.PI);

			remove = false;
		}
	}
}

