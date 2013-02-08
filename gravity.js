(function() {
var gravitySimulator;
var tmpCircle; 
var mouse;

// =========== Classes =============


// ---------- Vector class ----------
// -- V class (Vector) -- 
function V(x, y) {
    this.x = x;
    this.y = y;
}
V.prototype.getLength  = function() {
    return Math.sqrt(Math.sqr(this.x) + Math.sqr(this.y));
}
V.prototype.getUnit = function() {
    var dist = this.getLength();
    
    var unitX = this.x / dist || 0;
    var unitY = this.y / dist || 0;
    return new V(unitX, unitY);
}
V.prototype.toString = function() {
    return "V(" + this.x + ", " + this.y + ")";
}



// ---------- Circle class ----------
// x - center x coordinate
// y - center y coordinate
// r - radius of the circle
function Circle(x, y, radius, initialVelocity) {
    this.x = x;
    this.y = y;
    this.setRadius(radius);
    
    if (arguments.length == 4) {
      this.velocity = initialVelocity;;
    } else {
	this.velocity = new V(0, 0);
    }
    

    this.fillStyle = (radius < 15) ? '#ff0000' : '#fff000';
    this.strokeStyle = '#444400';
    this.interactive = false;
}
Circle.prototype.setRadius = function(radius) {
    this.radius = radius;

    this.volume = 4/3.0*(Math.PI)*(Math.pow(radius, 3)); // Volume of the sphere
    this.density = 1; // some constant density
    this.mass = this.density * this.volume;
}

Circle.prototype.getVectorToCircle = function(c) {
    var x = (c.x - this.x);
    var y = (c.y - this.y);
    return new V(x, y);
}

Circle.prototype.draw = function(ctx) {
    ctx.strokeStyle = this.strokeStyle;
    ctx.fillStyle = this.fillStyle;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0*Math.PI, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
    
    if (this.interactive) {
	ctx.beginPath();
	ctx.strokeStyle = '#FF00FF';
	ctx.fillStyle = '#FF00FF';
	ctx.moveTo(this.x, this.y);
	ctx.lineTo(this.x + this.velocity.x, this.y + this.velocity.y);
	ctx.stroke();
    }
}

Circle.prototype.log = function() {
    console.log("Circle( C(" + this.x + ", " + this.y + "), " +
		"radius: " + this.radius +
		", velocity: " + this.velocity.x + ", " + this.velocity.y + ")");
}


function GravitySimulator(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.circles = [];
    this.paused = false;
    
    
    this.layout();
    window.addEventListener('resize', this.layout.bind(this), false);
}

GravitySimulator.prototype.getCanvas = function() {
    return this.canvas;
}

GravitySimulator.prototype.layout = function() {
    this.canvas.width = (document.width || document.body.clientWidth) - 10;
    this.canvas.height = (document.height || document.body.clientHeight) -180;
}


GravitySimulator.prototype.start  = function() {
    this.paused = false;
    this.drawFrame();
}

GravitySimulator.prototype.isPaused  = function() {
    return (this.paused);    
}

GravitySimulator.prototype.resume  = function() {
    this.paused = false;    
}

GravitySimulator.prototype.pause  = function() {
    this.paused = true;    
}

GravitySimulator.prototype.drawFrame = function() {
    this.clear();
    if (!this.paused) {
	this.compute();
    }
    this.drawObjects();
    
    requestAnimationFrame(this.drawFrame.bind(this), this.canvas);       
}

GravitySimulator.prototype.compute = function() {
    this.computeVelocityVectors();
    this.applyVelocities();
}

GravitySimulator.prototype.computeVelocityVectors = function() {

    // Newton's law of universal gravitation
    // var G = 6.6726 * Math.pow(10, -11); //Universal gravitational constant

    // F = G (m1 * m2) / r^2
    // (m2 * g2) = G (m1 * m2) / r^2
    // g2 = G m1/r^2
    // v = G m1/r^2 * t
    
    
    var G = 0.005; // Use some appropriate G for simulation
    
    for (var i = 0; i < this.circles.length; i++) {
	for (var j = 0; j < this.circles.length; j++) {
	    
	    // pick only different circles;
	    if (i != j) {
              var c1 = this.circles[i];
		var c2 = this.circles[j];
		
		var v12 = c1.getVectorToCircle(c2);
		
		// get the unit vector
		var unit12 = v12.getUnit();
		var dist  = v12.getLength();
		
		// Apply Newton's law to calculate the gravity (acceleation)
		var force = G * c2.mass / Math.sqr(dist);
		var ax12 = force * unit12.x;
		var ay12 = force * unit12.y;
		
		// Check collision
		if (dist < c1.radius + c2.radius) {
		    
		    var fractionMass = c1.mass / (c1.mass + c2.mass);
		    
		    // Third Newton's law:  action <--> reaction   
		    ax12 *= -1;
		    ay12 *= -1;
		}
		
		// Append the velocity affected by acceleration to velocity vector
		c1.velocity.x += ax12;
		c1.velocity.y += ay12;
	    }
	}
    }
}


GravitySimulator.prototype.applyVelocities = function() {
    for (var i = 0; i < this.circles.length; i++) {
	var c = this.circles[i];
	// translate the circle to the new position per new velocity
	c.x += c.velocity.x;
	c.y += c.velocity.y;
    }
}



GravitySimulator.prototype.drawObjects = function() {
    for (var i = 0; i < this.circles.length; i++) {
	this.circles[i].draw(this.ctx);
    }
}

GravitySimulator.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0 , this.canvas.width, this.canvas.height);
}



GravitySimulator.prototype.addCircle = function(circle) {
    this.circles.push(circle);
}

function onMouseDown() {
    if (!gravitySimulator.isPaused()) {
	gravitySimulator.pause();
	
	var canvas = gravitySimulator.getCanvas();
	
	canvas.addEventListener('mouseup', onMouseUp, false);
	canvas.addEventListener('mousemove', onMouseMove, false);
	
	tmpCircle = new Circle(mouse.x, mouse.y, 0);
	tmpCircle.fillStyle = utils.getRandomColor();
	tmpCircle.interactive = true;
	
	gravitySimulator.addCircle(tmpCircle);
    }
}

function onMouseMove (event) {

    if (tmpCircle) {
	var dx = (mouse.x - tmpCircle.x);
	var dy = (mouse.y - tmpCircle.y);
	
	// specify the radius
	if (!tmpCircle.radiusFixed) {
	    tmpCircle.setRadius( Math.max(Math.abs(dx), Math.abs(dy)));
	    // specify the velocity vector
	} else {    
	    tmpCircle.velocity = new V(dx, dy);//.getUnit(); 
	}
    }
}

function onMouseUp() {
    if (gravitySimulator.isPaused() && tmpCircle) {
	
	// radius is set	
	if (!tmpCircle.radiusFixed) {
	    if (tmpCircle.radius > 0 ) {
		tmpCircle.radiusFixed = true;
	    }
	// velocity is set
        } else {
	    tmpCircle.velocity = tmpCircle.velocity.getUnit();
	    tmpCircle.velocity.x *= 3;
	    tmpCircle.velocity.y *= 3;
	    
	    var canvas = gravitySimulator.getCanvas();
            canvas.removeEventListener('mouseup', onMouseUp, false);
            canvas.removeEventListener('mousemove', onMouseMove, false);

	    tmpCircle.log();
            tmpCircle.interactive = false;
            tmpCirlce = null;
	    
	    gravitySimulator.resume();	    
	}
    }
}

function init() {
    var canvas = document.getElementById("myCanvas");
    mouse = utils.captureMouse(canvas);
    
    gravitySimulator = new GravitySimulator(canvas);
    gravitySimulator.addCircle(new Circle(300, 300, 50));
    gravitySimulator.addCircle(new Circle(100, 200, 10, new V(1.2,-2)));
    gravitySimulator.addCircle(new Circle(290, 100, 14.99, new V(4,0)));
    gravitySimulator.addCircle(new Circle(290, 500, 4, new V(4,1)));
    gravitySimulator.start();
    
    
    canvas.addEventListener('mousedown', onMouseDown, false);
}


window.onload = init;

// ========== Animation ============

// Define the HTML5 requestAnimationFrame if not found. 
window.requestAnimationFrame = (function(callback) {
    return window.requestAnimationFrame || 
	window.webkitRequestAnimationFrame || 
	window.mozRequestAnimationFrame || 
	window.oRequestAnimationFrame || 
	window.msRequestAnimationFrame ||
	function(callback) {
            console.log("Using custom requestAnimationFrame");
            // 30 frames per second
            window.setTimeout(callback, 1000 / 30);
	}})();


// =========== Utils  =========

// Add sqr to Math literal
Math.sqr = function(x) {
    return Math.pow(x, 2);
}



utils = {};

utils.getRandomColor = function() {
    function c() {
	return Math.floor(Math.random()*256).toString(16);
    }
    return "#" + c() + c () + c();
}



// Taken from Lamberta's book
utils.captureMouse = function (element) {
    var mouse = {x: 0, y: 0, event: null},
    body_scrollLeft = document.body.scrollLeft,
    element_scrollLeft = document.documentElement.scrollLeft,
    body_scrollTop = document.body.scrollTop,
    element_scrollTop = document.documentElement.scrollTop,
    offsetLeft = element.offsetLeft,
    offsetTop = element.offsetTop;
    
    element.addEventListener('mousemove', function (event) {
	var x, y;
	
	if (event.pageX || event.pageY) {
	    x = event.pageX;
	    y = event.pageY;
	    
	    x = event.clientX + body_scrollLeft + element_scrollLeft;
	    y = event.clientY + body_scrollTop + element_scrollTop;
	}
	x -= offsetLeft;
	y -= offsetTop;
	
	mouse.x = x;
	mouse.y = y;
	mouse.event = event;
    }, false);
    
    return mouse;
}

})();