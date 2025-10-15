const apps = [
  { name:"Proxy", id:"proxy", icon:"https://img.icons8.com/color/96/internet--v1.png", url:"https://proxyium.com" },
  { name:"Games", id:"games", icon:"https://img.icons8.com/color/96/controller.png", url:"haydendesktop.lol/apps/games/index2.html, _blank" },
  { name:"Remote Desktop", id:"remote", icon:"https://img.icons8.com/color/96/monitor.png", url:"https://parsec.app" },
  { name:"Settings", id:"settings", icon:"https://img.icons8.com/color/96/settings.png", url:"https://example.com" },
  { name:"File Explorer", id:"explorer", icon:"https://img.icons8.com/color/96/folder-invoices--v1.png", url:"https://example.com" },
  { name:"About", id:"about", icon:"https://img.icons8.com/color/96/info--v1.png", html:"<h2>About this web desktop</h2><p>Demo Windows 11 style web desktop.</p>" }
];

const desktop = document.getElementById("desktop");
const startMenu = document.getElementById("start-menu");
const startBtn = document.getElementById("start-menu-btn");
const searchBar = document.getElementById("search-bar");
const searchIcon = document.getElementById("search-icon");
const searchResults = document.getElementById("search-results");
let openWindows = [];
let zCounter = 100;

function buildDesktopIcons(){
  desktop.innerHTML = '';
  apps.forEach(app=>{
    const div = document.createElement('div');
    div.className='icon';
    div.tabIndex=0;
    div.innerHTML=`<img src="${app.icon}"><p>${app.name}</p>`;
    div.onclick = ()=>openApp(app);
    desktop.appendChild(div);
  });
}
buildDesktopIcons();

function buildStartMenuApps(){
  const startMenuApps = document.getElementById("start-menu-apps");
  startMenuApps.innerHTML='';
  apps.forEach(app=>{
    const div=document.createElement('div');
    div.className='start-app';
    div.innerHTML=`<img src="${app.icon}"><span>${app.name}</span>`;
    div.onclick=()=>{openApp(app); startMenu.style.display='none';};
    startMenuApps.appendChild(div);
  });
}
buildStartMenuApps();

// Start menu
startBtn.onclick = e=>{
  e.stopPropagation();
  startMenu.style.display = startMenu.style.display==='block'?'none':'block';
  searchResults.style.display='none';
};
document.addEventListener('click', e=>{
  if(!startMenu.contains(e.target) && e.target!==startBtn) startMenu.style.display='none';
});

// Search
function showSearchResults(results){
  if(results.length===0){ searchResults.innerHTML="<div class='result'>No results found.</div>"; }
  else{
    searchResults.innerHTML=results.map(app=>`<div class='result' tabindex=0 onclick='openApp(${JSON.stringify(app)}); hideSearch()'>
      <img src="${app.icon}"><span>${app.name}</span>
    </div>`).join('');
  }
  searchResults.style.display='block'; startMenu.style.display='none';
}
function hideSearch(){ searchResults.style.display='none'; }
searchBar.addEventListener('input', function(){
  const q=this.value.toLowerCase();
  if(!q){ hideSearch(); return; }
  showSearchResults(apps.filter(a=>a.name.toLowerCase().includes(q)));
});
searchIcon.onclick = ()=>{ showSearchResults(apps.filter(a=>a.name.toLowerCase().includes(searchBar.value.toLowerCase()))); };
document.addEventListener('click', e=>{
  if(!searchResults.contains(e.target) && e.target!==searchBar && e.target!==searchIcon) hideSearch();
});

// Clock
function updateTime(){ const now=new Date(); document.getElementById("time").innerText=now.getHours().toString().padStart(2,'0')+":"+now.getMinutes().toString().padStart(2,'0'); }
setInterval(updateTime,1000); updateTime();

// Notifications
function showNotification(msg,icon){
  const n=document.createElement('div');
  n.className='notification'; n.innerHTML=`<img src="${icon}"><span>${msg}</span>`;
  document.getElementById("notifications").appendChild(n);
  setTimeout(()=>n.remove(),3500);
}

// Running apps in taskbar
function updateRunningApps(){
  const container=document.getElementById("running-apps");
  container.innerHTML='';
  openWindows.forEach(win=>{
    const icon=document.createElement('div'); icon.className="task-icon"+(win.style.display==='none'?'':' active');
    const img=document.createElement('img'); img.src=win.dataset.icon;
    icon.appendChild(img);
    icon.onclick=()=>{ if(win.style.display==='none') win.style.display='flex'; win.style.zIndex=++zCounter; updateRunningApps(); };
    container.appendChild(icon);
  });
}

// Open app
function openApp(app){
  const win=document.createElement('div'); win.className='win11-window';
  win.dataset.icon=app.icon;
  win.style.left=Math.random()*200+100+"px"; win.style.top=Math.random()*100+60+"px"; win.style.zIndex=++zCounter;
  win.innerHTML=`<div class='win-header'>
    <div class='win-left'><img src='${app.icon}' class='win-icon'><span>${app.name}</span></div>
    <div class='win-controls'>
      <button class='min'>🗕</button><button class='max'>🗖</button><button class='close'>✖</button>
    </div>
  </div>
  <div class='win-body'></div>`;
  document.body.appendChild(win);

  const body = win.querySelector('.win-body');
  if(app.url){ const iframe=document.createElement('iframe'); iframe.src=app.url; body.appendChild(iframe); }
  else if(app.html){ body.innerHTML=app.html; }

  // Drag
  const header = win.querySelector('.win-header');
  header.onmousedown = e=>{
    let offsetX=e.clientX-win.offsetLeft, offsetY=e.clientY-win.offsetTop;
    win.style.zIndex=++zCounter;
    document.onmousemove = e2=>{ win.style.left=e2.clientX-offsetX+"px"; win.style.top=e2.clientY-offsetY+"px"; };
    document.onmouseup=()=>{ document.onmousemove=null; document.onmouseup=null; };
  };

  // Buttons
  const closeBtn=win.querySelector('.close'); const minBtn=win.querySelector('.min'); const maxBtn=win.querySelector('.max');
  closeBtn.onclick = ()=>{ win.remove(); openWindows=openWindows.filter(w=>w!==win); updateRunningApps(); };
  minBtn.onclick = ()=>{ win.style.display='none'; updateRunningApps(); showNotification(`${app.name} minimized`, app.icon); };
  let isMax=false;
  maxBtn.onclick=()=>{
    if(!isMax){ win.dataset.prev=JSON.stringify({left:win.style.left,top:win.style.top,width:win.style.width,height:win.style.height});
      win.style.left="0"; win.style.top="0"; win.style.width="100vw"; win.style.height="100vh"; isMax=true; }
    else{ const prev=JSON.parse(win.dataset.prev); Object.assign(win.style,prev); isMax=false; }
  };

  openWindows.push(win); updateRunningApps();
}
