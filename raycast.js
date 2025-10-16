// ================= 2D VECTOR ==================
class Vector2d {
    constructor(x, y) { this.x = x; this.y = y; }
    rotateBy(ang) { const c=Math.cos(ang), s=Math.sin(ang); return new Vector2d(this.x*c-this.y*s, this.x*s+this.y*c); }
    mult(k) { return new Vector2d(this.x*k,this.y*k); }
    add(v) { return new Vector2d(this.x+v.x,this.y+v.y); }
    sub(v) { return new Vector2d(this.x-v.x,this.y-v.y); }
    length() { return Math.hypot(this.x,this.y); }
    normalize() { let l=this.length(); return l>0?this.mult(1/l):new Vector2d(0,0); }
}

// ================= LINE ========================
class Line { 
    constructor(start,dir){this.start=start;this.dir=dir;} 
    eval(t){return new Vector2d(this.start.x+this.dir.x*t,this.start.y+this.dir.y*t);} 
    intersect(other){
        const A=[[this.dir.x,-other.dir.x],[this.dir.y,-other.dir.y]];
        const det=A[0][0]*A[1][1]-A[0][1]*A[1][0];
        if(det===0) return [-1,-1];
        const b=new Vector2d(other.start.x-this.start.x,other.start.y-this.start.y);
        const tx=(b.x*A[1][1]-b.y*A[0][1])/det;
        const ty=(A[0][0]*b.y-b.x*A[1][0])/det;
        return [tx,ty];
    } 
}

// ================= COLOR =======================
class Color { 
    constructor(r,g,b){this.r=Math.max(0,Math.min(r,1));this.g=Math.max(0,Math.min(g,1));this.b=Math.max(0,Math.min(b,1));this.canvasColor=`rgb(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)})`;} 
    intensify(m){return new Color(this.r*m,this.g*m,this.b*m);} 
}
Color.ERROR=new Color(1,0,1);

// ================= MAPS =======================
const maps = {
    easy: [
     [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
     [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
     [1,0,1,1,1,0,0,0,1,0,0,0,0,0,0,1,1,0,0,1],
     [1,0,1,0,0,0,1,0,1,0,1,0,0,1,0,0,1,1,0,1],
     [1,0,0,0,1,1,0,0,1,0,1,1,0,1,0,0,0,0,0,1],
     [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1],
     [1,0,0,1,0,1,1,0,0,1,0,1,0,0,1,0,0,1,0,1],
     [1,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
     [1,0,1,0,0,0,0,0,0,1,0,1,0,0,1,0,1,0,0,1],
     [1,0,0,0,0,1,1,1,0,1,0,0,0,1,0,0,0,1,0,1],
     [1,0,0,0,1,0,0,0,0,1,0,1,0,0,1,0,1,0,0,1],
     [1,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1],
     [1,0,0,1,1,0,1,0,0,0,0,1,0,0,1,0,1,0,0,1],
     [1,0,1,1,0,0,1,0,1,1,0,0,0,0,0,0,0,0,0,1],
     [1,0,1,0,0,1,0,0,0,1,0,1,0,0,1,0,1,0,0,1],
     [1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,1,0,0,1],
     [1,0,1,1,0,0,0,0,1,0,0,1,0,1,0,0,0,0,0,1],
     [1,0,0,1,1,1,0,1,0,0,1,0,0,0,1,0,1,1,0,1],
     [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
     [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
};

// ================= MAIN VARIABLES ==================
let gridMap = maps.easy;
let rawMap={walls:[]}, map={walls:[]};
let player={ pos:new Vector2d(1.5,1.5), dir:new Vector2d(1,0), fov:Math.PI/2, z:0, vz:0, onGround:true };
let yaw=0;
let bots = [];
let botSpeed = 2.;
let botRadius = 0.25;
let botImage = new Image();
botImage.src = "data:image/jpeg;base64,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"; // default
let ytLink = "";
let ytPlayer = null;

// ================= BUILD MAZE ==================
function buildMazeFromGrid(){
    rawMap.walls=[];
    for(let y=0;y<gridMap.length;y++){
        for(let x=0;x<gridMap[y].length;x++){
            if(gridMap[y][x]===1){
                let sx=x,sy=y;
                rawMap.walls.push({start:[sx,sy],end:[sx+1,sy],color:[0.8,0.2,0.2]});
                rawMap.walls.push({start:[sx+1,sy],end:[sx+1,sy+1],color:[0.2,0.8,0.2]});
                rawMap.walls.push({start:[sx+1,sy+1],end:[sx,sy+1],color:[0.2,0.2,0.8]});
                rawMap.walls.push({start:[sx,sy+1],end:[sx,sy],color:[0.8,0.8,0.2]});
            }
        }
    }
}

function processRawMap(){
    map={walls:[]};
    rawMap.walls.forEach(rawWall=>{
        const start=new Vector2d(rawWall.start[0],rawWall.start[1]);
        const dir=new Vector2d(rawWall.end[0]-start.x,rawWall.end[1]-start.y);
        const color=rawWall.color?new Color(...rawWall.color):Color.ERROR;
        map.walls.push({line:new Line(start,dir),color:color});
    });
}

// ================= INPUT =======================
let keys={};
document.addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true; if(e.key.toLowerCase()=="m") toggleMenu();});
document.addEventListener("keyup",e=>{keys[e.key.toLowerCase()]=false;});

// ================= POINTER LOCK ==================
const canvas=document.getElementById("viewport");
canvas.addEventListener("click",()=>{canvas.requestPointerLock();});
document.addEventListener("mousemove",(e)=>{
    if(document.pointerLockElement===canvas){
        yaw += e.movementX * 0.002;
        player.dir = new Vector2d(Math.cos(yaw), Math.sin(yaw));
    }
});

// ================= MOVEMENT ====================
function attemptMove(offset){
    const newPosX=player.pos.add(new Vector2d(offset.x,0));
    const gx=Math.floor(newPosX.x),gy=Math.floor(newPosX.y);
    if(gridMap[gy][gx]===0){ player.pos.x=newPosX.x; }
    const newPosY=player.pos.add(new Vector2d(0,offset.y));
    const gx2=Math.floor(newPosY.x),gy2=Math.floor(newPosY.y);
    if(gridMap[gy2][gx2]===0){ player.pos.y=newPosY.y; }
}
function updatePlayer(dt){
    let speed=2.5;
    if(keys["w"]) attemptMove(player.dir.mult(speed*dt));
    if(keys["s"]) attemptMove(player.dir.mult(-speed*dt));
    const right=new Vector2d(player.dir.y,-player.dir.x);
    if(keys["a"]) attemptMove(right.mult(speed*dt));
    if(keys["d"]) attemptMove(right.mult(-speed*dt));
    if(keys[" "]&&player.onGround){ player.vz=5.0; player.onGround=false; }
    player.z+=player.vz*dt;
    player.vz-=9.8*dt;
    if(player.z<=0){ player.z=0; player.vz=0; player.onGround=true; }
}

// ================= BOT AI ======================
function updateBots(dt){
    bots.forEach(bot => {
        const distX = Math.abs(player.pos.x - bot.pos.x);
        const distY = Math.abs(player.pos.y - bot.pos.y);

        // --- Inside 3x3? Move directly toward player ---
        if(distX <= 1.0 && distY <= 1.0){
            let dir = player.pos.sub(bot.pos).normalize();
            bot.pos = bot.pos.add(dir.mult(bot.speed * dt));
            if(ytPlayer) adjustYTVolume(bot.pos);
            return;
        }

        // --- Otherwise, move along grid toward player ---
        const cellX = Math.floor(bot.pos.x);
        const cellY = Math.floor(bot.pos.y);

        // Pick the neighbor cell closest to the player
        const neighbors = [];
        if(gridMap[cellY-1] && gridMap[cellY-1][cellX] === 0) neighbors.push({x: cellX + 0.5, y: cellY - 1 + 0.5});
        if(gridMap[cellY+1] && gridMap[cellY+1][cellX] === 0) neighbors.push({x: cellX + 0.5, y: cellY + 1 + 0.5});
        if(gridMap[cellY][cellX-1] === 0) neighbors.push({x: cellX - 1 + 0.5, y: cellY + 0.5});
        if(gridMap[cellY][cellX+1] === 0) neighbors.push({x: cellX + 1 + 0.5, y: cellY + 0.5});

        if(neighbors.length > 0){
            // find the neighbor closest to the player
            neighbors.sort((a,b) => {
                const da = Math.hypot(player.pos.x - a.x, player.pos.y - a.y);
                const db = Math.hypot(player.pos.x - b.x, player.pos.y - b.y);
                return da - db;
            });
            bot.targetCell = neighbors[0];
        } else {
            // no neighbors? stay in current cell center
            bot.targetCell = {x: cellX + 0.5, y: cellY + 0.5};
        }

        // Move smoothly toward target cell
        let moveDir = new Vector2d(bot.targetCell.x - bot.pos.x, bot.targetCell.y - bot.pos.y);
        let step = moveDir.normalize().mult(bot.speed * dt);

        let newPosX = bot.pos.add(new Vector2d(step.x, 0));
        let newPosY = bot.pos.add(new Vector2d(0, step.y));

        if(gridMap[Math.floor(newPosY.y)][Math.floor(newPosX.x)] === 0){
            bot.pos.x = newPosX.x;
            bot.pos.y = newPosY.y;
        }

        if(ytPlayer) adjustYTVolume(bot.pos);
    });
}

// ================= YOUTUBE =====================
function adjustYTVolume(botPos){
    let dist = player.pos.sub(botPos).length();
    let volume = Math.max(0, Math.min(1, 1.5 - dist/5));
    ytPlayer.setVolume(volume*100);
}

// ================= RAYCAST =====================
function castRays(nrays){
    let hits=[];let dAng=player.fov/nrays;
    for(let i=0;i<nrays;i++){
        let ang=-player.fov/2+dAng*i+dAng/2;
        let dir=player.dir.rotateBy(ang);
        let ray=new Line(player.pos,dir);
        hits.push(castOneRay(ray));
    }
    return hits;
}
function castOneRay(ray){
    let minT=Infinity, closestWall=undefined;
    map.walls.forEach(wall=>{
        const ts=ray.intersect(wall.line);
        if(ts[0]<0||ts[1]<0||ts[1]>1) return;
        if(ts[0]<minT){ minT=ts[0]; closestWall=wall; }
    });
    if(closestWall) return {t:minT,wall:closestWall};
    return undefined;
}

// ================= DRAW ========================
function drawColumns(canv,hits){
    const ctx=canv.getContext("2d"); const width=canv.width,height=canv.height;
    const dAng=player.fov/width;
    ctx.fillStyle="#8080FF"; ctx.fillRect(0,0,width,height/2);
    ctx.fillStyle="#FF8000"; ctx.fillRect(0,height/2,width,height/2);

    for(let i=0;i<width;i++){
        const ang=dAng*(i-width/2), x=i+0.5;
        const hit=hits[i]; if(!hit) continue;
        let h=(height*0.25)/(hit.t*Math.cos(ang));
        if(h<=0) continue;
        const color=hit.wall.color.intensify(hit.t>1?1/hit.t:1);
        ctx.strokeStyle=color.canvasColor;
        ctx.beginPath(); ctx.moveTo(x,(height-h)/2); ctx.lineTo(x,(height+h)/2); ctx.stroke();
    }

    // draw bots as images
    bots.forEach(bot=>{
        const dirToBot=bot.pos.sub(player.pos);
        const distToBot=dirToBot.length();
        const angToBot=Math.atan2(dirToBot.y,dirToBot.x)-Math.atan2(player.dir.y,player.dir.x);
        if(Math.abs(angToBot)<player.fov/2){
            const col=((angToBot+player.fov/2)/player.fov)*width;
            const size=(1.0/distToBot)*height*0.25;
            ctx.drawImage(botImage,col-size/2,height/2-size/2,size,size);
        }
    });
}

// ================= MENU =====================
let menuVisible = false;
function toggleMenu(){
    menuVisible = !menuVisible;
    const menu = document.getElementById("gameMenu");
    menu.style.display = menuVisible ? "block" : "none";
}

// ================= APPLY MENU ===================
document.getElementById("applyBtn").addEventListener("click",()=>{
    const diff=document.getElementById("mapSelect").value;
    const nBots=parseInt(document.getElementById("botCount").value)||1;
    const botURL=document.getElementById("botURL").value;
    const yt=document.getElementById("ytLink").value;

    if(diff in maps) { gridMap=maps[diff]; buildMazeFromGrid(); processRawMap(); }
    bots=[];
    for(let i=0;i<nBots;i++){
        bots.push({pos:new Vector2d(1.5+i,1.5+i), speed:botSpeed});
    }

    if(botURL) { botImage.src = botURL; }
    if(yt) { loadYT(yt); }
});

// ================= YOUTUBE LOAD ====================
function loadYT(videoID){
    if(ytPlayer) ytPlayer.destroy();
    ytPlayer = new YT.Player('ytPlayer', {
        height: '0', width: '0', videoId: videoID,
        playerVars: { autoplay:1, loop:1, playlist:videoID },
        events: { onReady:function(event){ event.target.setVolume(0); event.target.playVideo(); } }
    });
}

// ================= GAME LOOP ==================
let lastTime=null;
function gameLoop(time){
    if(!lastTime) lastTime=time;
    const dt=(time-lastTime)/1000; lastTime=time;
    updatePlayer(dt); updateBots(dt);
    drawColumns(canvas, castRays(canvas.width));
    requestAnimationFrame(gameLoop);
}

// ================= INIT =======================
document.addEventListener("DOMContentLoaded",()=>{
    buildMazeFromGrid(); processRawMap();
    bots.push({pos:new Vector2d(1.5,1.5), speed:botSpeed});
    requestAnimationFrame(gameLoop);
});
