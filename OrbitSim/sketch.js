let massiveObjects = [];
let objID = 0;

// camera vars
let cameraX = 0;
let cameraY = 0;
let cameraScale = 1;
let cameraMoveSpeed = 1;
let mouseScrolled = 0;

// global vars
let trailLength;
let planetScale = 0;
let moveMode = "FocusBigGuy";
// "FocusBigGuy" = center on the most massive object
// "SelfMove" = the user has control over camera and zoom
let mostMassiveObjectID = 0;
let mostMass = 0;

let doPlaceObjects = true;

function setup()
{
  createCanvas(windowWidth, windowHeight);
  trailLength = createSlider(0, 200, 100);
  trailLength.position(width - 150, 50);
  //newMassiveObject(5, [500, 200], createVector(0, 1), true, true, 500);
  //newMassiveObject(20, [700, 300], createVector(0, 0), true, true, 500);
  for (let i = 0; i < 100; i++)
  {
    //newRandomObject();
  }
}

function draw()
{
  background(0);
  cameraControls();
  drawGrid();
  for (let i = 0; i < massiveObjects.length; i++)
  {
   massiveObjects[i].drawSelf(true);
  }
  for (let i = 0; i < massiveObjects.length; i++)
  {
    massiveObjects[i].updateSelf();
  }
  
  mouseScrolled = 0;
  if (mouseIsPressed) { planetScale += 1 / cameraScale; ellipse(mouseX, mouseY, planetScale * cameraScale) }
  else planetScale = 0;

  let p1 = deAdjustForCamera(mouseX, mouseY);
  p1 = adjustForCamera(p1[0], p1[1]);
  noFill();
  stroke(255);
  ellipse(p1[0], p1[1], 50);
  fill(255);
  stroke(0);
}

function UI(){
  fill(255);
  stroke(0);
  strokeWeight(1);
  text(round(frameRate()), width - 200, 100);
  switch(moveMode){
    case "FocusBigGuy":
      text("Focusing On Object ID: " + mostMassiveObjectID, width/2 - 200, 200);
      break;
  }
}

function drawGrid()
{
  stroke(200, 200, 200, 100);
  strokeWeight(1);
  push();
  let gridScale = 150 * cameraScale;
  for (let x = 0; x < width; x += gridScale)
  {
    line((cameraX % gridScale) + x, 0, (cameraX % gridScale) + x, height);
  }
  for (let y = 0; y < height; y += gridScale)
  {
    line(0, (cameraY % gridScale) + y, width, (cameraY % gridScale) + y);
  }
  pop();
}

function newRandomObject()
{
  newMassiveObject(random(10, 50), [800 + random(-1, 1), 500], createVector(random(-5, 5), random(-5, 5)), true, true, trailLength.value())
}

function newMassiveObject(mass, startPosition, initialForceVector, drawPlanet, drawTail, trailLength)
{
  // define the new object
  let nmo = new massiveObject(mass, startPosition, initialForceVector, drawPlanet, drawTail, trailLength);
  // push the the array
  massiveObjects.push(nmo);
  if (mass > mostMass) { console.log(mostMassiveObjectID); mostMassiveObjectID = objID - 1; mostMass = mass }
  return nmo;
}

class massiveObject
{
  constructor(mass, startPosition, initialForceVector, drawPlanet, drawTail, trailLength)
  {
    // mass
    this.mass = mass;

    // start position
    this.startX = startPosition[0];
    this.startY = startPosition[1];

    //current position
    this.x = this.startX;
    this.y = this.startY;

    // force vectors
    this.currentForceVector = initialForceVector;
    this.initialForceVector = initialForceVector;

    // drawing variables
    this.fillColor = [random(50, 200), random(50, 200), random(50, 200)];
    this.drawTrail = drawTail;
    this.drawPlanet = drawPlanet;
    this.trailPositions = [];
    this.trailLength = trailLength;

    // id system
    this.objID = objID;
    objID++;
  }
  updateSelf()
  {
    this.drawSelf();
    this.updateTrail();
    this.doPhysics();
  }
  drawSelf(trail)
  {
    // trail is just a bool to determine whether or not the trail is drawn in order to have them drawn below the planets
    // draw the trail
    if (trail == true&&this.drawTrail == true)
    {

      // itterate over the trail positions
      for (let i = 0; i < this.trailPositions.length - 1; i++)
      {

        // stroke and strokeWeight go from a max to a min depending on how far into the array it is
        let c1 = map(i / this.trailPositions.length, 0, this.trailPositions.length, 0, 255) * this.trailPositions.length;
        stroke(c1);
        strokeWeight(map(this.trailPositions.length - i, 0, this.trailPositions.length, 0, 20) * cameraScale);

        // adjust the positions for the camera
        let pos2 = adjustForCamera(this.trailPositions[i].x, this.trailPositions[i].y);
        let pos3 = adjustForCamera(this.trailPositions[i + 1].x, this.trailPositions[i + 1].y);

        // line between two positions
        line(pos2[0], pos2[1], pos3[0], pos3[1]);
      }
    }

    // draw the planet itself
    strokeWeight(1);
    stroke(0);
    if (this.drawPlanet == true&&trail==undefined) { let pos1 = adjustForCamera(this.x, this.y); ellipse(pos1[0], pos1[1], this.mass * cameraScale); }
  }
  updateTrail()
  {
    // update the new position
    this.trailLength = trailLength.value();
    this.trailPositions.push(createVector(this.x, this.y));

    // if there are too many saved positions, 
    while (this.trailPositions.length > this.trailLength) this.trailPositions.shift();
  }
  doPhysics()
  {
    let endXForce = 0;
    let endYForce = 0;

    for (let i = 0; i < massiveObjects.length; i++)
    {
      let m1 = massiveObjects[i];
      if (m1.objID != this.objID)
      {
        let d1 = dist(this.x, this.y, m1.x, m1.y);
        let a1 = atan2(this.x - m1.x, this.y - m1.y);
        let forceVec1 = createVector(m1.mass / d1, 0);
        forceVec1.rotate(-(a1 + PI / 2));

        let inertia = m1.mass / this.mass;

        endXForce += forceVec1.x * inertia / 10;
        endYForce += forceVec1.y * inertia / 10;
      }
    }

    let pos1 = adjustForCamera(this.x, this.y);
    
    if(doPlaceObjects==false&&mouseIsPressed&&collc(pos1[0], pos1[1], mouseX, mouseY, 1, 1, this.mass)){
      this.endXForce += movedX;
      this.endXForce += movedY;
    }

    this.currentForceVector.x += endXForce;
    this.currentForceVector.y += endYForce;

    this.x += this.currentForceVector.x;
    this.y += this.currentForceVector.y;
  }
  drawDebug()
  {

  }
}

function collc(x, y, w, h, x2, y2, w2, h2, bx, by)
{
  // apply the bezzle to the xs
  if (bx != 0 && bx != undefined)
  {
    x = x - bx / 2;
    x2 = x2 - bx / 2;
    w = w + bx;
    w2 = w2 + bx;
  }

  // apply the bezzle to the ys
  if (by != 0 && by != undefined)
  {
    y = y - by / 2;
    y2 = y2 - by / 2;
    h = h + by;
    h2 = h2 + by;
  }

  // draw hit boxes if debug mode is on and H is pressed
  if (keyIsDown(72)) { fill(200, 50, 50, 100); rect(x, y, w, h); rect(x2, y2, w2, h2) }

  if (x + w > x2 && x < x2 + w2 && y + h > y2 && y < y2 + h2) return true;

  return false;
}

function cameraControls()
{
  // up/down/left/right movement
  if (moveMode == "SelfMove")
  {
    let movingX = 0;
    let movingY = 0;

    if (keyIsDown(87)) { cameraY += cameraMoveSped / cameraScale; movingY = 1; } else
      if (keyIsDown(83)) { cameraY -= cameraMoveSped / cameraScale; movingY = -1; }
    if (keyIsDown(68)) { cameraX -= cameraMoveSped / cameraScale; movingX = -1; } else
      if (keyIsDown(65)) { cameraX += cameraMoveSped / cameraScale; movingX = 1; }

    if (keyIsDown(82)) cameraMoveSped = 6;
    else cameraMoveSped = 3;

    // moving diagonal moves at the same overall speed, not double the speed as it would be otherwise
    if (movingX != false && movingY != false) { cameraX -= cameraMoveSped * 0.1 * movingX; cameraY -= cameraMoveSped * 0.1 * movingY }
    // cameraScale makes the relative speed the same as it gets larger and smaller
  } else if (massiveObjects[mostMassiveObjectID] != undefined)
  {
    cameraX = -massiveObjects[mostMassiveObjectID].x + width / 2;
    cameraY = -massiveObjects[mostMassiveObjectID].y + height / 2;
  }

  if (keyIsDown(38)) cameraScale += round(10 * (0.5 * cameraScale)) / 100; else
  if (keyIsDown(40)) cameraScale -= round(10 * (0.5 * cameraScale)) / 100;
  // mouse scrolling for scale
  cameraScale -= mouseScrolled / 800;
  // constrain the cameraScale to a reasonable amount
  cameraScale = constrain(cameraScale, 0.1, 3);
  cameraScale = round(cameraScale * 100) / 100;
}

function adjustForCamera(x, y)
{
  // adjust by camera position
  x += cameraX;
  y += cameraY;

  // adjust the position for the scale arround the center point
  // tDist gets the "true distance" or simply includes negative signs
  // if X is greater than X2
  let c1 = cameraScale - 1;

  x += (c1*(tDist(x,width/2)));
  y += (c1*(tDist(y,height/2)));

  // return the position
  return [x, y];
}

function tDist(x, x2)
{
  //if(x + x2 == undefined) console.log("ERROR: X and or X2 left undefined in tDist")
  if (x < x2) return -dist(x, 0, x2, 0);
  else return dist(x, 0, x2, 0);
}

function mouseWheel(event)
{
  mouseScrolled = event.delta;
}

function deAdjustForCamera(x, y)
{
  let c1 = cameraScale - 1;

  if(c1!=0){
    x += tDist(x,width/2)/cameraScale;
    y += tDist(y,height/2)/cameraScale;
  } else {
  }

  x -= cameraX;
  y -= cameraY;

  return [x, y];
}

function mouseReleased()
{
  if (planetScale > 0 && doPlaceObjects == true)
  {
    let pos1 = deAdjustForCamera(mouseX, mouseY)
    newMassiveObject(planetScale, [pos1[0], pos1[1]], createVector(0, 0), true, true, 100);
  }
}

function keyPressed()
{
  // reset to default scale
  if (keyCode === 81) cameraScale = 1;
  // reset button
  if (keyCode === 67) {massiveObjects = []; mostMass = 0; mostMassiveObjectID = 0;}
  // swap placing mode
  if (keyCode === 84) {doPlaceObjects = !doPlaceObjects}

}
