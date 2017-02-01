(function (globals) {
    "use strict";

    Bridge.define('Planets.App', {
        statics: {
            container: null,
            canvas: null,
            startPlanets: 0,
            timLimitScale: 0,
            timeScale: 0,
            gScale: 0,
            newPlanetSpeedScale: 0,
            config: {
                init: function () {
                    Bridge.ready(this.main);
                }
            },
            main: function () {
                Planets.App.getContainerProperties();
    
                Planets.App.setupCanvas();
    
                var sky = new Planets.Sky(Planets.App.container.clientWidth, Planets.App.container.clientHeight, Planets.App.timLimitScale, Planets.App.gScale, Planets.App.newPlanetSpeedScale, Planets.App.timeScale);
    
                //Add a bunch of new planets at random places
                sky.addRandomPlanets(Planets.App.startPlanets);
    
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
                var ctx = Planets.App.canvas.getContext("2d");
    
                var timestamp = Bridge.global.performance.now();
    
                window.requestAnimationFrame(function (t) {
                    Planets.App.renderFrame(sky, ctx, t, timestamp, true);
                });
    
            },
            getContainerProperties: function () {
                Planets.App.container = Bridge.cast(document.getElementById("planets-container"), HTMLDivElement);
                Planets.App.container.style.margin = "0px";
    
                var startPlanetsStr = Planets.App.container.getAttribute("data-startPlanets");
                var timLimitScaleStr = Planets.App.container.getAttribute("data-timLimitScale");
                var timeScaleStr = Planets.App.container.getAttribute("data-timeScale");
                var gScaleStr = Planets.App.container.getAttribute("data-gScale");
                var newPlanetSpeedScaleStr = Planets.App.container.getAttribute("data-newPlanetSpeedScale");
    
                var startPlanets = { v : 0 };
                if (!System.Int32.tryParse(startPlanetsStr, startPlanets)) {
                    startPlanets.v = Planets.Sky.dEFAULT_START_PLANETS;
                }
                Planets.App.startPlanets = startPlanets.v;
    
                var timLimitScale = { v : 0 };
                if (!System.Double.tryParse(timLimitScaleStr, null, timLimitScale)) {
                    timLimitScale.v = 1;
                }
                Planets.App.timLimitScale = timLimitScale.v;
    
                var timeScale = { v : 0 };
                if (!System.Double.tryParse(timeScaleStr, null, timeScale)) {
                    timeScale.v = 1;
                }
                Planets.App.timeScale = timeScale.v;
    
                var gScale = { v : 0 };
                if (!System.Double.tryParse(gScaleStr, null, gScale)) {
                    gScale.v = 1;
                }
                Planets.App.gScale = gScale.v;
    
                var newPlanetSpeedScale = { v : 0 };
                if (!System.Double.tryParse(newPlanetSpeedScaleStr, null, newPlanetSpeedScale)) {
                    newPlanetSpeedScale.v = 1;
                }
                Planets.App.newPlanetSpeedScale = newPlanetSpeedScale.v;
            },
            setupCanvas: function () {
                Planets.App.canvas = Bridge.cast(document.createElement("canvas"), HTMLCanvasElement);
                Planets.App.canvas.id = "planet_canvas";
                Planets.App.canvas.width = Planets.App.container.clientWidth;
                Planets.App.canvas.height = Planets.App.container.clientHeight;
                Planets.App.canvas.style.width = "100%";
                Planets.App.canvas.style.height = "100%";
                Planets.App.canvas.style.backgroundColor = "transparent";
                Planets.App.canvas.style.display = "block";
    
                //Append the sky to the body of the page
                document.body.style.margin = "0px";
                //Document.Body.AppendChild(canvas);
                Planets.App.container.appendChild(Planets.App.canvas);
            },
            renderFrame: function (sky, ctx, currenttime, prevtime, recalc) {
                var elapsedTime = currenttime - prevtime;
                elapsedTime %= 100;
    
                sky.move(elapsedTime);
                Planets.App.redrawSky(ctx, sky);
    
                if (recalc) {
                    sky.recalculateGravity(elapsedTime);
                }
    
                window.requestAnimationFrame(function (t) {
                    Planets.App.renderFrame(sky, ctx, t, currenttime, !recalc);
                });
            },
            redrawSky: function (ctx, sky) {
                ctx.clearRect(0, 0, sky.xSize, sky.ySize);
                ctx.fillStyle = "white";
    
                if (Planets.App.canvas.width !== Planets.App.container.clientWidth || Planets.App.canvas.height !== Planets.App.container.clientHeight) {
                    Planets.App.canvas.width = Planets.App.container.clientWidth;
                    Planets.App.canvas.height = Planets.App.container.clientHeight;
                    sky.xSize = Planets.App.canvas.width;
                    sky.ySize = Planets.App.canvas.height;
                }
    
                for (var i = 0; i < sky.planets.getCount(); i = (i + 1) | 0) {
                    var planet = sky.planets.get(i);
                    ctx.beginPath();
                    ctx.arc(planet.x, planet.y, planet.radius, 0, 2 * Math.PI);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        },
        $entryPoint: true
    });
    
    Bridge.define('Planets.Planet', {
        statics: {
            count: System.Int64(0)
        },
        id: System.Int64(0),
        x: 0,
        y: 0,
        size: 0,
        xVel: 0,
        yVel: 0,
        futureXVel: 0,
        futureYVel: 0,
        radius: 0,
        remove: false,
        constructor: function (x, y, size, xVel, yVel) {
            this.id = Planets.Planet.count;
            Planets.Planet.count = Planets.Planet.count.inc();
    
            this.x = x;
            this.y = y;
            this.size = size;
            this.xVel = xVel;
            this.yVel = yVel;
    
            this.futureXVel = xVel;
            this.futureYVel = yVel;
    
            this.radius = 2 * Math.sqrt(size / 1000 / Math.PI);
    
            this.remove = false;
        }
    });
    
    Bridge.define('Planets.Sky', {
        statics: {
            dEFAULT_TIM_LIMIT: 51200000.0,
            dEFAULT_START_PLANETS: 100,
            dEFAULT_G: 0.0053392640000000007
        },
        g: 0,
        timLimit: 0,
        newPlanetSpeedScale: 0,
        timeScale: 0,
        xSize: 0,
        ySize: 0,
        planets: null,
        constructor: function (xSize, ySize, timLimitScale, gScale, newPlanetSpeedScale, timeScale) {
            this.xSize = xSize;
            this.ySize = ySize;
    
            this.timLimit = timLimitScale * Planets.Sky.dEFAULT_TIM_LIMIT;
            this.g = Planets.Sky.dEFAULT_G * gScale;
            this.newPlanetSpeedScale = newPlanetSpeedScale;
            this.timeScale = timeScale;
    
            this.planets = new System.Collections.Generic.List$1(Planets.Planet)();
    
        },
        addRandomPlanets: function (numPlanets) {
            for (var i = 0; i < numPlanets; i = (i + 1) | 0) {
                var x = Math.random() * this.xSize;
                var y = Math.random() * this.ySize;
                var xVel = Math.random() * 10 - 5.0;
                var yVel = Math.random() * 10 - 5.0;
                var newPlanet = new Planets.Planet(x, y, 50000, xVel, yVel);
                this.addPlanet(newPlanet);
            }
        },
        recalculateGravity: function (elapsedTime) {
    
            for (var i = 0; i < this.planets.getCount(); i = (i + 1) | 0) {
                var planet = this.planets.get(i);
                if (!planet.remove) {
                    planet.futureXVel = planet.xVel;
                    planet.futureYVel = planet.yVel;
                    for (var j = 0; j < this.planets.getCount(); j = (j + 1) | 0) {
                        var otherPlanet = this.planets.get(j);
                        if (!otherPlanet.remove && !planet.remove && otherPlanet.id.ne(planet.id)) {
                            var xDistance = otherPlanet.x - planet.x;
                            var yDistance = otherPlanet.y - planet.y;
                            var totalDistanceSquared = xDistance * xDistance + yDistance * yDistance;
                            var totalDistance = Math.sqrt(totalDistanceSquared);
                            if (totalDistance < (planet.radius + otherPlanet.radius)) {
                                //collision
                                var xInwardKE = planet.size * planet.xVel * Math.abs(planet.xVel) - otherPlanet.size * otherPlanet.xVel * Math.abs(otherPlanet.xVel);
                                var yInwardKE = planet.size * planet.yVel * Math.abs(planet.yVel) - otherPlanet.size * otherPlanet.yVel * Math.abs(otherPlanet.yVel);
    
                                var totalInwardKE = Math.sqrt(xInwardKE * xInwardKE + yInwardKE * yInwardKE);
                                var newX = (planet.size * planet.x + otherPlanet.size * otherPlanet.x) / (planet.size + otherPlanet.size);
                                var newY = (planet.size * planet.y + otherPlanet.size * otherPlanet.y) / (planet.size + otherPlanet.size);
                                if (totalInwardKE > this.timLimit) {
                                    //explosion
                                    var totalSize = planet.size + otherPlanet.size;
                                    var averageXVel = (planet.size * planet.xVel + otherPlanet.size * otherPlanet.xVel) / totalSize;
                                    var averageYVel = (planet.size * planet.yVel + otherPlanet.size * otherPlanet.yVel) / totalSize;
                                    var numPlanets = Bridge.Int.clip32((planet.size + otherPlanet.size) / 50000.0);
                                    if (numPlanets > 20) {
                                        numPlanets = 20;
                                    }
                                    var newSize = totalSize / numPlanets;
                                    var newVel = Math.sqrt(this.g * (planet.size + otherPlanet.size)) / 10.0 * this.newPlanetSpeedScale;
                                    var newRadius = Math.sqrt(planet.size / 1000.0 / Math.PI);
                                    //pi * distance * 2 must be greater than numPlanets * newRadius;
                                    var explosionRadius = 1.1 * newRadius * numPlanets / Math.PI;
                                    var angle = 2.0 * Math.PI / numPlanets;
                                    var currentAngle = Math.PI * Math.random();
                                    for (var k = 0; k < numPlanets; k = (k + 1) | 0) {
                                        this.addPlanet(new Planets.Planet(newX + (explosionRadius * Math.cos(currentAngle)), newY + (explosionRadius * Math.sin(currentAngle)), newSize, averageXVel + newVel * Math.cos(currentAngle), averageYVel + newVel * Math.sin(currentAngle)));
                                        currentAngle += angle;
                                    }
                                }
                                else  {
                                    //combine
                                    this.combine(planet, otherPlanet);
                                }
                                //remove old planets
                                planet.remove = true;
                                otherPlanet.remove = true;
                            }
                            else  {
                                var force = this.g * planet.size * otherPlanet.size / totalDistanceSquared;
                                //change velocity
                                planet.xVel = planet.xVel + (force / planet.size * xDistance / totalDistance) * elapsedTime / 16.0;
                                planet.yVel = planet.yVel + (force / planet.size * yDistance / totalDistance) * elapsedTime / 16.0;
                            }
                        }
                    }
                }
            }
    
            var index = 0;
            while (index < this.planets.getCount()) {
                var planet1 = this.planets.get(index);
                if (planet1.remove) {
                    this.planets.removeAt(index);
                }
                else  {
                    index = (index + 1) | 0;
                }
            }
        },
        move: function (elapsedTime) {
            for (var i = 0; i < this.planets.getCount(); i = (i + 1) | 0) {
                var planet = this.planets.get(i);
                planet.x += planet.xVel * elapsedTime / 16.0 * this.timeScale;
                planet.y += planet.yVel * elapsedTime / 16.0 * this.timeScale;
                planet.x %= this.xSize;
                planet.y %= this.ySize;
                while (planet.x < 0) {
                    planet.x += this.xSize;
                }
                while (planet.y < 0) {
                    planet.y += this.ySize;
                }
    
            }
        },
        combine: function (planet1, planet2) {
            //combine
            var newSize = planet1.size + planet2.size;
            var newX = (planet1.size * planet1.x + planet2.size * planet2.x) / newSize;
            var newY = (planet1.size * planet1.y + planet2.size * planet2.y) / newSize;
            var newXVel = (planet1.size * planet1.xVel + planet2.size * planet2.xVel) / newSize;
            var newYVel = (planet1.size * planet1.yVel + planet2.size * planet2.yVel) / newSize;
    
            this.addPlanet(new Planets.Planet(newX, newY, newSize, newXVel, newYVel));
        },
        addPlanets: function (planetsToAdd) {
            for (var i = 0; i < planetsToAdd.getCount(); i = (i + 1) | 0) {
                this.addPlanet(planetsToAdd.get(i));
            }
        },
        addPlanet: function (newPlanet) {
            this.planets.add(newPlanet);
        }
    });
    
    Bridge.init();
})(this);
