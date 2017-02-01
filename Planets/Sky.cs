using System;
using System.Collections.Generic;
using Bridge.Html5;

namespace Planets
{
	public class Sky
	{
		public static double DEFAULT_TIM_LIMIT = 100000 * 4.0 * 128.0;
		public static int DEFAULT_START_PLANETS = 100;
		public static double DEFAULT_G = 0.0000000000667408 * 20000000.0 * 4;

		double g;
		double timLimit;
		double newPlanetSpeedScale;
		double timeScale;

		public int xSize;
		public int ySize;

		public List<Planet> planets;

		public Sky(int xSize, int ySize, double timLimitScale, double gScale, double newPlanetSpeedScale, double timeScale)
		{
			this.xSize = xSize;
			this.ySize = ySize;

			this.timLimit = timLimitScale * DEFAULT_TIM_LIMIT;
			this.g = DEFAULT_G * gScale;
			this.newPlanetSpeedScale = newPlanetSpeedScale;
			this.timeScale = timeScale;

			planets = new List<Planet>();

		}

		public void addRandomPlanets(int numPlanets) {
			for (var i = 0; i < numPlanets; i++)
			{
				double x = Math.Random() * xSize;
				double y = Math.Random() * ySize;
				double xVel = Math.Random() * 10 - 5.0;
				double yVel = Math.Random() * 10 - 5.0;
				Planet newPlanet = new Planet(x, y, 50000, xVel, yVel);
				addPlanet(newPlanet);
			}
		}

		public void recalculateGravity(double elapsedTime) {

			for (int i=0; i<planets.Count; i++) {
				Planet planet = planets.Get(i);
				if (!planet.remove) {
					planet.futureXVel = planet.xVel;
					planet.futureYVel = planet.yVel;
					for (int j=0; j<planets.Count; j++) {
						Planet otherPlanet = planets.Get(j);
						if(!otherPlanet.remove && !planet.remove && otherPlanet.id != planet.id) {
							double xDistance = otherPlanet.x - planet.x;
							double yDistance = otherPlanet.y - planet.y;
							double totalDistanceSquared = xDistance * xDistance + yDistance * yDistance;
							double totalDistance = Math.Sqrt(totalDistanceSquared);
							if (totalDistance < (planet.radius + otherPlanet.radius)) {
								//collision
								double xInwardKE = planet.size * planet.xVel * Math.Abs(planet.xVel) - otherPlanet.size * otherPlanet.xVel * Math.Abs(otherPlanet.xVel);
								double yInwardKE = planet.size * planet.yVel * Math.Abs(planet.yVel) - otherPlanet.size * otherPlanet.yVel * Math.Abs(otherPlanet.yVel);

								double totalInwardKE = Math.Sqrt(xInwardKE * xInwardKE + yInwardKE * yInwardKE);
								double newX = (planet.size * planet.x + otherPlanet.size * otherPlanet.x) / (planet.size + otherPlanet.size);
								double newY = (planet.size * planet.y + otherPlanet.size * otherPlanet.y) / (planet.size + otherPlanet.size);
								if (totalInwardKE > timLimit) {
									//explosion
									double totalSize = planet.size + otherPlanet.size;
									double averageXVel = (planet.size * planet.xVel + otherPlanet.size * otherPlanet.xVel) / totalSize;
									double averageYVel = (planet.size * planet.yVel + otherPlanet.size * otherPlanet.yVel) / totalSize;
									int numPlanets = (int) ((planet.size + otherPlanet.size) / 50000.0);
									if(numPlanets > 20) {
										numPlanets = 20;
									}
									double newSize = totalSize / numPlanets;
									double newVel = Math.Sqrt(g * (planet.size + otherPlanet.size)) / 10.0 * newPlanetSpeedScale;
									double newRadius = Math.Sqrt(planet.size / 1000.0 / Math.PI);
									//pi * distance * 2 must be greater than numPlanets * newRadius;
									double explosionRadius = 1.1 * newRadius * numPlanets / Math.PI;
									double angle = 2.0 * Math.PI / numPlanets;
									double currentAngle = Math.PI * Math.Random();
									for (int k = 0; k < numPlanets; k++) {
										addPlanet(new Planet(newX + (explosionRadius * Math.Cos(currentAngle)), newY + (explosionRadius * Math.Sin(currentAngle)), newSize, averageXVel + newVel * Math.Cos(currentAngle), averageYVel + newVel * Math.Sin(currentAngle)));
										currentAngle += angle;
									}
								} else {
									//combine
									combine(planet, otherPlanet);
								}
								//remove old planets
								planet.remove = true;
								otherPlanet.remove = true;
							} else {
								double force = g * planet.size * otherPlanet.size / totalDistanceSquared;
								//change velocity
								planet.xVel = planet.xVel + (force / planet.size * xDistance / totalDistance) * elapsedTime/16.0;
								planet.yVel = planet.yVel + (force / planet.size * yDistance / totalDistance) * elapsedTime/16.0;
							}
						}
					}
				}
			}

			int index=0;
			while (index < planets.Count) {
				Planet planet = planets.Get (index);
				if (planet.remove) {
					planets.RemoveAt (index);
				} else {
					index++;
				}
			}
		}

		public void move(double elapsedTime) {
			for (int i=0; i<planets.Count; i++) {
				Planet planet = planets.Get (i);
				planet.x += planet.xVel * elapsedTime / 16.0 * timeScale;
				planet.y += planet.yVel * elapsedTime / 16.0 * timeScale;
				planet.x %= xSize;
				planet.y %= ySize;
				while (planet.x < 0) {
					planet.x += xSize;
				}
				while (planet.y < 0) {
					planet.y += ySize;
				}

			}
		}

		public void combine(Planet planet1, Planet planet2) {
			//combine
			double newSize = planet1.size + planet2.size;
			double newX = (planet1.size * planet1.x + planet2.size * planet2.x) / newSize;
			double newY = (planet1.size * planet1.y + planet2.size * planet2.y) / newSize;
			double newXVel = (planet1.size * planet1.xVel + planet2.size * planet2.xVel) / newSize;
			double newYVel = (planet1.size * planet1.yVel + planet2.size * planet2.yVel) / newSize;

			addPlanet(new Planet(newX, newY, newSize, newXVel, newYVel));
		}

		public void addPlanets(List<Planet> planetsToAdd) {
			for (int i = 0; i < planetsToAdd.Count; i++) {
				addPlanet (planetsToAdd.Get (i));
			}
		}

		public void addPlanet(Planet newPlanet) {
			planets.Add (newPlanet);
		}
	}
}

