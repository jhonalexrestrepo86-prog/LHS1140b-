
let stars = [];
let terrain = [];
let craters = [];

const DESIGN_W = 1920;
const DESIGN_H = 1080;

let rotation = 0;
let dragging = false;
let autoRotation = false;
let scanMode = false;
let atmosphereEnabled = true;
let showData = true;
let nightMode = false;

let zoomFactor = 1;
let scanPosition = -300;
let atmospherePulse = 0;

let selectedRegion = null;
let pressX = 0;
let pressY = 0;
let dragTravelled = 0;

// =================================
// SISTEMA ORBITAL
// =================================

let viewMode = "surface";
let orbitAngle = 0;
let orbitRunning = true;
let orbitSpeed = 0.006;

// ILUMINACIÓN DINÁMICA

let dynamicLightingEnabled = true;
let surfaceLightX = 480;
let surfaceLightY = -325;

// =================================
// REGIONES HIPOTÉTICAS
// =================================

let waterRegions = [
  {
    lon:-2.1, lat:0.25, size:65,
    name:"OCEAN REGION 01",
    description:"Posible acumulacion de agua liquida o hielo bajo condiciones favorables."
  },
  {
    lon:-1.2, lat:-0.4, size:85,
    name:"OCEAN REGION 02",
    description:"Zona hipotetica de interes para estudiar la presencia de agua."
  },
  {
    lon:0.1, lat:0.35, size:75,
    name:"OCEAN REGION 03",
    description:"Deposito hipotetico de material rico en agua."
  },
  {
    lon:1.1, lat:-0.2, size:95,
    name:"OCEAN REGION 04",
    description:"Region ilustrativa que representa una posible reserva de agua."
  },
  {
    lon:2.2, lat:0.5, size:65,
    name:"OCEAN REGION 05",
    description:"Area hipotetica para exploracion de materiales volatiles."
  }
];

let iceRegions = [
  {
    lon:-2.8, lat:1.05, size:75,
    name:"ICE FORMATION 01",
    description:"Posible deposito de hielo superficial en una region fria."
  },
  {
    lon:-0.7, lat:1.1, size:65,
    name:"ICE FORMATION 02",
    description:"Zona hipotetica de acumulacion de hielo."
  },
  {
    lon:1.8, lat:-1.0, size:80,
    name:"ICE FORMATION 03",
    description:"Region de interes para estudiar materiales congelados."
  }
];

// =================================
// CONFIGURACIÓN
// =================================

function setup() {

  pixelDensity(1);
  createResponsiveCanvas();

  randomSeed(1140);

  selectedRegion = {
    type:"ROCKY TERRAIN",
    name:"GENERAL SURFACE",
    description:"Superficie rocosa generada mediante un modelo visual procedural.",
    lon:0,
    lat:0
  };

  for (let i=0; i<450; i++) {

    stars.push({
      x:random(DESIGN_W),
      y:random(DESIGN_H),
      size:random(1,4),
      alpha:random(80,230)
    });
  }

  for (let i=0; i<500; i++) {

    terrain.push({
      lon:random(-PI,PI),
      lat:asin(random(-1,1)),
      size:random(3,28),
      alpha:random(15,65),
      type:random(2)
    });
  }

  for (let i=0; i<65; i++) {

    craters.push({
      lon:random(-PI,PI),
      lat:asin(random(-1,1)),
      r:random(0.018,0.065)
    });
  }
}

function createResponsiveCanvas() {

  let cw=min(windowWidth,windowHeight*16/9);
  cw=min(cw,DESIGN_W);

  let canvas=createCanvas(cw,cw*9/16);

  canvas.style("display","block");
  canvas.style("margin","auto");
}

function windowResized() {
  createResponsiveCanvas();
}

// =================================
// DIRECCIÓN DE ILUMINACIÓN
// =================================

function getLightingDirection() {

  let dx = surfaceLightX;
  let dy = surfaceLightY;

  if (dynamicLightingEnabled) {

    let starX = 650;
    let starY = 525;

    let orbitRX = 560;
    let orbitRY = 260;

    let planetX = starX + cos(orbitAngle)*orbitRX;
    let planetY = starY + sin(orbitAngle)*orbitRY;

    dx = starX-planetX;
    dy = starY-planetY;
  }

  let magnitude = sqrt(dx*dx+dy*dy);

  if (magnitude < 0.001) {
    magnitude = 1;
  }

  return {
    x:dx/magnitude,
    y:dy/magnitude,
    angle:atan2(dy,dx)
  };
}

// =================================
// ESCENA PRINCIPAL
// =================================

function draw() {

  background(
    nightMode?0:3,
    nightMode?0:5,
    nightMode?5:15
  );

  // La órbita continúa avanzando
  // incluso cuando observamos la superficie.

  if (orbitRunning) {
    orbitAngle += orbitSpeed;
  }

  let s=width/DESIGN_W;

  push();
  scale(s);

  drawStars();

  if (viewMode==="surface") {
    drawSurfaceScene();
  } else {
    drawOrbitScene();
  }

  pop();

  atmospherePulse=sin(frameCount*0.035);
}

// =================================
// ESCENA DE SUPERFICIE
// =================================

function drawSurfaceScene() {

  drawRedStar(1510,265);

  if (autoRotation && !dragging) {
    rotation+=0.002;
  }

  drawPlanet(
    1030,
    590,
    300*zoomFactor
  );

  drawSelectedMarker(
    1030,
    590,
    300*zoomFactor
  );

  if (scanMode) {
    drawScan(
      1030,
      590,
      300*zoomFactor
    );
  }

  drawInterface();
  drawControls();
  drawRegionPanel();
}

// =================================
// ESTRELLAS
// =================================

function drawStars() {

  noStroke();

  for (let star of stars) {

    let twinkle=
      sin(frameCount*0.025+star.x)*20;

    fill(
      210,220,255,
      star.alpha+twinkle
    );

    circle(
      star.x,
      star.y,
      star.size
    );
  }
}

// =================================
// ESTRELLA ENANA ROJA
// =================================

function drawRedStar(x,y) {

  push();
  noStroke();

  for (let i=10; i>=1; i--) {
    fill(210,45,25,7);
    circle(x,y,i*38);
  }

  fill(190,48,30);
  circle(x,y,90);

  fill(225,83,43);
  circle(x,y,68);

  fill(245,125,70,170);
  circle(x-8,y-8,38);

  pop();
}

// =================================
// PROYECCIÓN ESFÉRICA
// =================================

function projectSurface(lon,lat,r) {

  let angle=lon+rotation;

  return {
    x:sin(angle)*cos(lat)*r,
    y:-sin(lat)*r,
    z:cos(angle)*cos(lat)
  };
}

// =================================
// PLANETA
// =================================

function drawPlanet(x,y,r) {

  let ctx=drawingContext;

  let light = getLightingDirection();

  if (atmosphereEnabled) {

    noFill();

    for (let i=5; i>=1; i--) {

      stroke(
        75,160,205,
        7+atmospherePulse*1.5
      );

      strokeWeight(i*12);
      circle(x,y,r*2+i*8);
    }

    stroke(
      100,190,230,
      35+atmospherePulse*15
    );

    strokeWeight(17);
    circle(x,y,r*2+25);
  }

  ctx.save();

  ctx.beginPath();
  ctx.arc(x,y,r,0,TWO_PI);
  ctx.clip();

  // SUPERFICIE BASE

  let surface=ctx.createRadialGradient(
    x+light.x*r*0.45,
    y+light.y*r*0.45,
    10,
    x-light.x*r*0.15,
    y-light.y*r*0.15,
    r*1.35
  );

  if (nightMode) {

    surface.addColorStop(0,"#657780");
    surface.addColorStop(0.25,"#465A65");
    surface.addColorStop(0.55,"#263A48");
    surface.addColorStop(0.82,"#152532");
    surface.addColorStop(1,"#03070D");

  } else {

    surface.addColorStop(0,"#B6C5C9");
    surface.addColorStop(0.25,"#758C96");
    surface.addColorStop(0.55,"#465B67");
    surface.addColorStop(0.82,"#263A48");
    surface.addColorStop(1,"#080D17");
  }

  ctx.fillStyle=surface;
  ctx.fillRect(x-r,y-r,r*2,r*2);

  // TERRENO PROCEDURAL

  noStroke();

  for (let t of terrain) {

    let p=projectSurface(t.lon,t.lat,r);

    if (p.z>0) {

      if (t.type<1) {
        fill(180,190,185,t.alpha);
      } else {
        fill(30,55,70,t.alpha);
      }

      let depth=map(p.z,0,1,0.45,1);

      circle(
        x+p.x,
        y+p.y,
        t.size*depth
      );
    }
  }

  // REGIONES HIPOTÉTICAS

  drawSurfaceRegions(x,y,r,waterRegions,"water");
  drawSurfaceRegions(x,y,r,iceRegions,"ice");

  // CRÁTERES

  for (let c of craters) {

    let p=projectSurface(c.lon,c.lat,r);

    if (p.z>0.12) {

      let cr=c.r*r*map(p.z,0,1,0.6,1);

      drawCrater(
        x+p.x,
        y+p.y,
        cr
      );
    }
  }

  // ILUMINACIÓN DINÁMICA

  drawDynamicSurfaceLight(
    x,
    y,
    r,
    light.x,
    light.y
  );

  ctx.restore();

  if (atmosphereEnabled) {

    noFill();

    stroke(
      125,190,220,
      125+atmospherePulse*15
    );

    strokeWeight(3);
    circle(x,y,r*2);

    stroke(170,215,230,35);
    strokeWeight(9);

    arc(
      x,y,
      r*2+8,r*2+8,
      -PI,0
    );
  }
}

// =================================
// ILUMINACIÓN DINÁMICA SUPERFICIAL
// =================================

function drawDynamicSurfaceLight(x,y,r,lightX,lightY) {

  let ctx=drawingContext;

  let lightCenterX=x+lightX*r*0.48;
  let lightCenterY=y+lightY*r*0.48;

  let shadowCenterX=x-lightX*r*0.55;
  let shadowCenterY=y-lightY*r*0.55;

  ctx.save();

  ctx.beginPath();
  ctx.arc(x,y,r,0,TWO_PI);
  ctx.clip();

  // REFLEJO DE LUZ ROJIZA

  let glow=ctx.createRadialGradient(
    lightCenterX,
    lightCenterY,
    2,
    lightCenterX,
    lightCenterY,
    r*1.25
  );

  glow.addColorStop(0,"rgba(255,165,110,0.30)");
  glow.addColorStop(0.35,"rgba(255,105,65,0.17)");
  glow.addColorStop(0.75,"rgba(255,80,40,0.06)");
  glow.addColorStop(1,"rgba(255,70,30,0)");

  ctx.fillStyle=glow;
  ctx.fillRect(x-r,y-r,r*2,r*2);

  // SOMBRA DEL LADO OPUESTO

  let shadow=ctx.createRadialGradient(
    shadowCenterX,
    shadowCenterY,
    5,
    shadowCenterX,
    shadowCenterY,
    r*1.25
  );

  shadow.addColorStop(0,"rgba(0,0,0,0.78)");
  shadow.addColorStop(0.35,"rgba(0,0,0,0.48)");
  shadow.addColorStop(0.72,"rgba(0,0,0,0.18)");
  shadow.addColorStop(1,"rgba(0,0,0,0)");

  ctx.fillStyle=shadow;
  ctx.fillRect(x-r,y-r,r*2,r*2);

  ctx.restore();
}

// =================================
// REGIONES DE AGUA Y HIELO
// =================================

function drawSurfaceRegions(x,y,r,regions,type) {

  noStroke();

  for (let region of regions) {

    let p=projectSurface(
      region.lon,
      region.lat,
      r
    );

    if (p.z>0.15) {

      let px=x+p.x;
      let py=y+p.y;

      let size=region.size*map(p.z,0,1,0.55,1);

      if (type==="water") {

        fill(15,85,130,100);
        ellipse(px,py,size*1.5,size);

        fill(30,135,180,75);

        ellipse(
          px-size*0.12,
          py-size*0.12,
          size*0.85,
          size*0.55
        );

        fill(100,195,215,35);

        ellipse(
          px-size*0.2,
          py-size*0.2,
          size*0.4,
          size*0.25
        );

      } else {

        fill(195,220,225,110);
        ellipse(px,py,size*1.3,size);

        fill(235,245,245,100);

        ellipse(
          px-size*0.1,
          py-size*0.1,
          size*0.75,
          size*0.6
        );
      }
    }
  }
}

// =================================
// CRÁTERES
// =================================

function drawCrater(x,y,r) {

  let ctx=drawingContext;

  noStroke();
  fill(5,12,20,100);

  circle(
    x+r*0.15,
    y+r*0.2,
    r*2
  );

  let gradient=ctx.createRadialGradient(
    x-r*0.3,y-r*0.35,1,
    x,y,r
  );

  gradient.addColorStop(0,"#182A34");
  gradient.addColorStop(0.65,"#344A54");
  gradient.addColorStop(1,"#758A91");

  ctx.fillStyle=gradient;

  ctx.beginPath();
  ctx.arc(x,y,r*0.83,0,TWO_PI);
  ctx.fill();

  noFill();
  stroke(190,205,200,95);
  strokeWeight(max(1,r*0.09));

  arc(
    x,y,
    r*1.8,r*1.8,
    PI,TWO_PI
  );
}

// =================================
// ESCÁNER
// =================================

function drawScan(x,y,r) {

  let ctx=drawingContext;

  ctx.save();

  ctx.beginPath();
  ctx.arc(x,y,r,0,TWO_PI);
  ctx.clip();

  scanPosition+=2.5;

  if (scanPosition>r) {
    scanPosition=-r;
  }

  stroke(50,220,255,190);
  strokeWeight(3);

  line(
    x-r,y+scanPosition,
    x+r,y+scanPosition
  );

  stroke(50,190,255,35);
  strokeWeight(20);

  line(
    x-r,y+scanPosition,
    x+r,y+scanPosition
  );

  ctx.restore();

  noFill();
  stroke(80,220,255,150);
  strokeWeight(2);

  circle(x,y,r*2+35);
}

// =================================
// SELECCIÓN DE REGIONES
// =================================

function selectRegionAt(screenX,screenY) {

  let x=1030;
  let y=590;
  let r=300*zoomFactor;

  let dx=screenX-x;
  let dy=screenY-y;

  let nx=dx/r;
  let ny=dy/r;

  let distanceSquared=nx*nx+ny*ny;

  if (distanceSquared>1) return;

  let nz=sqrt(max(0,1-distanceSquared));

  let lat=asin(-ny);
  let angle=atan2(nx,nz);
  let lon=angle-rotation;

  selectedRegion={
    type:"ROCKY TERRAIN",
    name:"ROCKY SURFACE",
    description:"Terreno rocoso del modelo procedural. La composicion real de esta zona no ha sido determinada.",
    lon:lon,
    lat:lat
  };

  let bestDistance=Infinity;
  let bestRegion=null;

  let allRegions=[
    ...waterRegions.map(r=>({...r,type:"POSSIBLE WATER"})),
    ...iceRegions.map(r=>({...r,type:"ICE DEPOSIT"}))
  ];

  for (let region of allRegions) {

    let p=projectSurface(
      region.lon,
      region.lat,
      r
    );

    if (p.z<=0.15) continue;

    let px=x+p.x;
    let py=y+p.y;

    let d=dist(screenX,screenY,px,py);

    let limit=region.size*0.75;

    if (d<limit && d<bestDistance) {

      bestDistance=d;
      bestRegion=region;
    }
  }

  if (bestRegion) {

    selectedRegion={
      type:bestRegion.type,
      name:bestRegion.name,
      description:bestRegion.description,
      lon:bestRegion.lon,
      lat:bestRegion.lat
    };
  }
}

// =================================
// MARCADOR DE SELECCIÓN
// =================================

function drawSelectedMarker(x,y,r) {

  if (!selectedRegion) return;

  let p=projectSurface(
    selectedRegion.lon,
    selectedRegion.lat,
    r
  );

  if (p.z<=0.12) return;

  let px=x+p.x;
  let py=y+p.y;

  let pulse=sin(frameCount*0.09)*5;

  push();

  noFill();

  stroke(70,225,255,210);
  strokeWeight(3);

  circle(px,py,32+pulse);

  stroke(70,225,255,100);
  strokeWeight(1);

  circle(px,py,49+pulse);

  line(px-28,py,px-12,py);
  line(px+12,py,px+28,py);
  line(px,py-28,px,py-12);
  line(px,py+12,px,py+28);

  pop();
}

// =================================
// FICHA DE INVESTIGACIÓN
// =================================

function drawRegionPanel() {

  let x=100;
  let y=620;
  let w=480;
  let h=265;

  noStroke();
  fill(5,18,30,235);
  rect(x,y,w,h,12);

  noFill();
  stroke(70,145,180,180);
  strokeWeight(2);
  rect(x,y,w,h,12);

  noStroke();
  fill(80,190,225);
  textAlign(LEFT);
  textSize(17);

  text("SURFACE ANALYSIS",x+24,y+35);

  fill(100,145,170);
  textSize(14);

  text(
    "REGION IDENTIFICATION SYSTEM",
    x+24,y+59
  );

  fill(220,240,245);
  textSize(25);

  text(
    selectedRegion.name,
    x+24,y+105
  );

  let regionColor=[110,175,205];

  if (selectedRegion.type==="POSSIBLE WATER") {
    regionColor=[40,165,220];
  }

  if (selectedRegion.type==="ICE DEPOSIT") {
    regionColor=[200,230,240];
  }

  fill(...regionColor);
  textSize(16);

  text(
    "TYPE: "+selectedRegion.type,
    x+24,y+137
  );

  fill(160,190,205);
  textSize(16);

  let words=selectedRegion.description.split(" ");
  let lineText="";
  let lineY=y+177;

  for (let word of words) {

    let test=lineText+word+" ";

    if (textWidth(test)>w-48) {

      text(lineText,x+24,lineY);

      lineText=word+" ";
      lineY+=23;

    } else {
      lineText=test;
    }
  }

  text(lineText,x+24,lineY);

  fill(90,145,175);
  textSize(13);

  text(
    "LAT: "+nf(selectedRegion.lat*180/PI,1,1)+"°",
    x+24,y+240
  );

  text(
    "LON: "+nf(selectedRegion.lon*180/PI,1,1)+"°",
    x+210,y+240
  );
}

// =================================
// INTERFAZ DE SUPERFICIE
// =================================

function drawInterface() {

  noStroke();

  fill(180,205,220);
  textAlign(LEFT);
  textSize(34);

  text("LHS 1140 b",100,115);

  fill(100,150,175);
  textSize(19);

  text(
    "EXOPLANET EXPLORATION",
    100,150
  );

  stroke(70,110,135,100);
  line(100,175,420,175);

  noStroke();

  fill(135,175,195);
  textSize(19);

  text("DRAG TO ROTATE",100,950);

  fill(90,130,155);
  textSize(16);

  text(
    "TAP TO INVESTIGATE",
    100,980
  );

  if (showData) {

    textAlign(RIGHT);

    fill(130,165,185);
    textSize(18);

    text(
      "SCIENTIFIC VISUALIZATION",
      1810,100
    );

    fill(90,125,150);
    textSize(15);

    text(
      "PROCEDURAL PLANET MODEL",
      1810,130
    );

    fill(120,155,175);
    textSize(16);

    text("DISTANCE: ~48 LIGHT YEARS",1810,185);
    text("RADIUS: ~1.73 EARTH RADII",1810,215);
    text("MASS: ~5.6 EARTH MASSES",1810,245);
    text("ORBIT: ~24.7 DAYS",1810,275);

    let light=getLightingDirection();

    let angleDegrees=degrees(light.angle);

    if (angleDegrees<0) {
      angleDegrees+=360;
    }

    fill(255,155,115);
    textSize(15);

    text(
      "STELLAR LIGHT: "+(dynamicLightingEnabled?"DYNAMIC":"FIXED"),
      1810,310
    );

    fill(130,175,195);

    text(
      "LIGHT ANGLE: "+nf(angleDegrees,1,1)+"°",
      1810,335
    );

    let longitude=(rotation*180/PI)%360;

    if (longitude<0) longitude+=360;

    fill(100,155,180);
    textSize(19);

    text(
      "LONGITUDE: "+nf(longitude,3,1)+"°",
      1810,950
    );

    text("LATITUDE: 0.0°",1810,980);
  }

  textAlign(LEFT);

  fill(80,165,210);
  text("WATER - HYPOTHETICAL",100,1030);

  fill(205,225,230);
  text("ICE - HYPOTHETICAL",440,1030);
}

// =================================
// BOTONES
// =================================

function drawButton(label,x,y,active) {

  fill(
    active?20:8,
    active?65:20,
    active?85:35,
    230
  );

  stroke(
    active?80:55,
    active?180:110,
    active?220:145,
    180
  );

  strokeWeight(2);
  rect(x,y,350,55,8);

  noStroke();
  fill(170,210,225);

  textAlign(LEFT,CENTER);
  textSize(19);

  text(
    label+" ["+(active?"ON":"OFF")+"]",
    x+18,y+27
  );
}

// =================================
// CONTROLES DE SUPERFICIE
// =================================

function drawControls() {

  drawButton("ORBITAL VIEW",1430,310,true);

  drawButton("AUTO ROTATION",1430,390,autoRotation);
  drawButton("PLANET SCANNER",1430,465,scanMode);
  drawButton("ATMOSPHERE",1430,540,atmosphereEnabled);
  drawButton("DATA PANEL",1430,615,showData);
  drawButton("NIGHT MODE",1430,690,nightMode);

  fill(12,35,55,230);
  stroke(80,155,190);
  strokeWeight(2);

  rect(1430,775,165,55,8);
  rect(1615,775,165,55,8);
  rect(1430,850,350,55,8);

  noStroke();
  fill(170,210,225);

  textAlign(CENTER,CENTER);
  textSize(18);

  text("ZOOM +",1512,802);
  text("ZOOM -",1697,802);
  text("RESET VIEW",1605,877);
}

// =================================
// VISTA ORBITAL
// =================================

function drawOrbitScene() {

  let starX=650;
  let starY=525;

  let orbitRX=560;
  let orbitRY=260;

  // TÍTULO

  noStroke();
  fill(180,205,220);
  textAlign(LEFT);
  textSize(34);

  text("LHS 1140 SYSTEM",100,115);

  fill(100,150,175);
  textSize(19);

  text("ORBITAL SIMULATION",100,150);

  stroke(70,110,135,100);
  line(100,175,460,175);

  // ÓRBITA

  noFill();
  stroke(65,115,145,100);
  strokeWeight(2);

  ellipse(
    starX,
    starY,
    orbitRX*2,
    orbitRY*2
  );

  // PUNTOS DE REFERENCIA

  noStroke();
  fill(80,135,165,100);

  for (let a=0; a<TWO_PI; a+=PI/12) {

    let px=starX+cos(a)*orbitRX;
    let py=starY+sin(a)*orbitRY;

    circle(px,py,4);
  }

  // ESTRELLA CENTRAL

  drawRedStar(starX,starY);

  // POSICIÓN DEL PLANETA

  let planetX=starX+cos(orbitAngle)*orbitRX;
  let planetY=starY+sin(orbitAngle)*orbitRY;

  // LÍNEA DE POSICIÓN

  stroke(75,150,185,90);
  strokeWeight(1);

  line(
    starX,
    starY,
    planetX,
    planetY
  );

  // PLANETA ILUMINADO HACIA LA ESTRELLA

  drawOrbitalPlanet(
    planetX,
    planetY,
    36,
    starX-planetX,
    starY-planetY
  );

  // ETIQUETAS

  noStroke();
  textAlign(CENTER);

  fill(235,145,105);
  textSize(19);

  text("LHS 1140",starX,starY+115);

  fill(150,205,225);
  textSize(17);

  text(
    "LHS 1140 b",
    planetX,
    planetY-55
  );

  // INDICADOR DE MOVIMIENTO

  fill(100,165,195);
  textAlign(LEFT);
  textSize(16);

  text(
    "ORBITAL PATH",
    100,
    250
  );

  text(
    "SCHEMATIC REPRESENTATION",
    100,
    275
  );

  // INFORMACIÓN Y CONTROLES

  drawOrbitInformation();
  drawOrbitControls();

  fill(80,125,150);
  textSize(14);
  textAlign(LEFT);

  text(
    "ILLUSTRATIVE ORBIT - NOT TO SCALE",
    100,
    1020
  );
}

// =================================
// PLANETA EN VISTA ORBITAL
// =================================

function drawOrbitalPlanet(x,y,r,lightX,lightY) {

  let magnitude=sqrt(lightX*lightX+lightY*lightY);

  if (magnitude<0.001) magnitude=1;

  let ux=lightX/magnitude;
  let uy=lightY/magnitude;

  let ctx=drawingContext;

  push();

  noStroke();

  // ATMÓSFERA

  for (let i=4; i>=1; i--) {

    fill(65,160,205,8);

    circle(
      x,
      y,
      r*2+i*12
    );
  }

  // GRADIENTE ORIENTADO HACIA LA ESTRELLA

  let lightCenterX=x+ux*r*0.4;
  let lightCenterY=y+uy*r*0.4;

  let gradient=ctx.createRadialGradient(
    lightCenterX,
    lightCenterY,
    2,
    x,
    y,
    r*1.3
  );

  gradient.addColorStop(0,"#E4D8C2");
  gradient.addColorStop(0.25,"#A6BBC0");
  gradient.addColorStop(0.55,"#627D8C");
  gradient.addColorStop(0.8,"#263D50");
  gradient.addColorStop(1,"#050B16");

  ctx.fillStyle=gradient;

  ctx.beginPath();
  ctx.arc(x,y,r,0,TWO_PI);
  ctx.fill();

  // SOMBRA DEL LADO OPUESTO

  let shadowX=x-ux*r*0.5;
  let shadowY=y-uy*r*0.5;

  let shadow=ctx.createRadialGradient(
    shadowX,
    shadowY,
    1,
    shadowX,
    shadowY,
    r*1.3
  );

  shadow.addColorStop(0,"rgba(0,0,0,0.78)");
  shadow.addColorStop(0.55,"rgba(0,0,0,0.35)");
  shadow.addColorStop(1,"rgba(0,0,0,0)");

  ctx.save();

  ctx.beginPath();
  ctx.arc(x,y,r,0,TWO_PI);
  ctx.clip();

  ctx.fillStyle=shadow;
  ctx.fillRect(x-r,y-r,r*2,r*2);

  ctx.restore();

  // TEXTURA

  noStroke();

  fill(180,205,210,100);
  ellipse(x-9,y-10,13,7);

  fill(35,90,120,130);
  ellipse(x+10,y+7,18,9);

  fill(220,235,235,100);
  ellipse(x-2,y+14,8,5);

  // CONTORNO

  noFill();
  stroke(120,200,225,160);
  strokeWeight(2);

  circle(x,y,r*2);

  pop();
}

// =================================
// INFORMACIÓN ORBITAL
// =================================

function drawOrbitInformation() {

  let x=100;
  let y=650;
  let w=440;
  let h=260;

  noStroke();
  fill(5,18,30,235);
  rect(x,y,w,h,12);

  noFill();
  stroke(70,145,180,180);
  strokeWeight(2);
  rect(x,y,w,h,12);

  noStroke();

  fill(80,190,225);
  textAlign(LEFT);
  textSize(18);

  text("ORBITAL DATA",x+24,y+38);

  fill(190,215,225);
  textSize(20);

  text(
    "LHS 1140 b",
    x+24,y+82
  );

  fill(120,165,190);
  textSize(16);

  text(
    "ORBITAL PERIOD: ~24.7 DAYS",
    x+24,y+120
  );

  text(
    "STAR TYPE: RED DWARF",
    x+24,y+153
  );

  text(
    "DISTANCE: ~48 LIGHT YEARS",
    x+24,y+186
  );

  fill(80,185,220);

  text(
    "SIMULATION SPEED: "+nf(orbitSpeed/0.006,1,1)+"x",
    x+24,y+225
  );

  let light=getLightingDirection();

  let angleDegrees=degrees(light.angle);

  if (angleDegrees<0) {
    angleDegrees+=360;
  }

  fill(255,155,115);
  textSize(14);

  text(
    "STELLAR LIGHT ANGLE: "+nf(angleDegrees,1,1)+"°",
    x+24,y+248
  );
}

// =================================
// CONTROLES ORBITALES
// =================================

function drawOrbitControls() {

  drawButton("SURFACE VIEW",1430,310,true);

  drawButton(
    orbitRunning?"PAUSE ORBIT":"RESUME ORBIT",
    1430,390,
    orbitRunning
  );

  fill(12,35,55,230);
  stroke(80,155,190);
  strokeWeight(2);

  rect(1430,480,165,60,8);
  rect(1615,480,165,60,8);

  rect(1430,565,350,60,8);
  rect(1430,650,350,60,8);

  noStroke();
  fill(170,210,225);

  textAlign(CENTER,CENTER);
  textSize(18);

  text("SPEED -",1512,510);
  text("SPEED +",1697,510);

  text("RESET ORBIT",1605,595);

  text(
    "DYNAMIC LIGHT: "+(dynamicLightingEnabled?"ON":"OFF"),
    1605,680
  );

  fill(100,155,180);
  textSize(15);

  textAlign(LEFT);

  text(
    "CHANGE ORBITAL VELOCITY",
    1430,745
  );
}

// =================================
// INTERACCIÓN
// =================================

function mousePressed() {

  let s=width/DESIGN_W;

  let mx=mouseX/s;
  let my=mouseY/s;

  pressX=mx;
  pressY=my;
  dragTravelled=0;
  dragging=false;

  // CAMBIAR DE VISTA

  if (
    mx>=1430 && mx<=1780 &&
    my>=310 && my<=365
  ) {

    if (viewMode==="surface") {
      viewMode="orbit";
      dragging=false;
    } else {
      viewMode="surface";
      dragging=false;
    }

    return false;
  }

  // CONTROLES ORBITALES

  if (viewMode==="orbit") {

    if (
      mx>=1430 && mx<=1780 &&
      my>=390 && my<=445
    ) {

      orbitRunning=!orbitRunning;
      return false;
    }

    if (my>=480 && my<=540) {

      if (mx>=1430 && mx<=1595) {
        orbitSpeed=max(0.001,orbitSpeed-0.001);
        return false;
      }

      if (mx>=1615 && mx<=1780) {
        orbitSpeed=min(0.025,orbitSpeed+0.001);
        return false;
      }
    }

    if (
      mx>=1430 && mx<=1780 &&
      my>=565 && my<=625
    ) {

      orbitAngle=0;
      return false;
    }

    // ACTIVAR / DESACTIVAR LUZ DINÁMICA

    if (
      mx>=1430 && mx<=1780 &&
      my>=650 && my<=710
    ) {

      dynamicLightingEnabled=!dynamicLightingEnabled;
      return false;
    }

    return false;
  }

  // CONTROLES DE SUPERFICIE

  if (mx>=1430 && mx<=1780) {

    if (my>=390 && my<=445) {
      autoRotation=!autoRotation;
      return false;
    }

    if (my>=465 && my<=520) {
      scanMode=!scanMode;
      return false;
    }

    if (my>=540 && my<=595) {
      atmosphereEnabled=!atmosphereEnabled;
      return false;
    }

    if (my>=615 && my<=670) {
      showData=!showData;
      return false;
    }

    if (my>=690 && my<=745) {
      nightMode=!nightMode;
      return false;
    }
  }

  // ZOOM

  if (my>=775 && my<=830) {

    if (mx>=1430 && mx<=1595) {
      zoomFactor=min(1.7,zoomFactor+0.1);
      return false;
    }

    if (mx>=1615 && mx<=1780) {
      zoomFactor=max(0.7,zoomFactor-0.1);
      return false;
    }
  }

  // RESET DE SUPERFICIE

  if (
    mx>=1430 && mx<=1780 &&
    my>=850 && my<=905
  ) {

    rotation=0;
    zoomFactor=1;
    scanPosition=-300;
    autoRotation=false;
    scanMode=false;

    selectedRegion={
      type:"ROCKY TERRAIN",
      name:"GENERAL SURFACE",
      description:"Superficie rocosa generada mediante un modelo visual procedural.",
      lon:0,
      lat:0
    };

    return false;
  }

  // DETECTAR SI SE TOCÓ EL PLANETA

  let dx=mx-1030;
  let dy=my-590;
  let radius=300*zoomFactor;

  if (dx*dx+dy*dy<radius*radius) {
    dragging=true;
  }

  return false;
}

function mouseDragged() {

  if (viewMode==="surface" && dragging) {

    let s=width/DESIGN_W;

    dragTravelled+=
      abs(movedX/s)+abs(movedY/s);

    if (!autoRotation) {

      rotation+=
        (movedX/s)*0.003;
    }
  }

  return false;
}

function mouseReleased() {

  if (
    viewMode==="surface" &&
    dragging &&
    dragTravelled<12
  ) {

    let s=width/DESIGN_W;

    selectRegionAt(
      pressX,
      pressY
    );
  }

  dragging=false;
  return false;
}

function doubleClicked() {

  if (viewMode==="surface") {
    rotation=0;
  } else {
    orbitAngle=0;
  }

  return false;
}

function mouseWheel(event) {

  if (viewMode==="surface") {

    if (event.delta>0) {
      zoomFactor=max(0.7,zoomFactor-0.05);
    } else {
      zoomFactor=min(1.7,zoomFactor+0.05);
    }
  }

  return false;
}
