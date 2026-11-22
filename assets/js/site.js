const ROOT = document.querySelector('meta[name="site-root"]').content;
const url = path => ROOT + path.replace(/^\//,'');
async function getData(name) {
  const response=await fetch(url(`data/${name}.json`));
  if(!response.ok) throw new Error(`Cannot load ${name}.json`);
  return response.json();
}
function el(tag,klass,text) {
  const n=document.createElement(tag);
  if(klass)n.className=klass;
  if(text!==undefined)n.textContent=text;
  return n
}
function setImage(container, src, label) {
  container.replaceChildren();
  if(src) {
    let im=el('img','artwork-image');
    im.src=url(src);
    im.alt=label;
    im.loading='lazy';
    container.append(im)
  }
  else {
    container.classList.add('placeholder');
    container.append(el('small','',label||'Image to be supplied'))
  }
}
function buildArtistCard(artist) {
  const link=el('a','tile');
  link.href=url(`artists/profile.html?artist=${encodeURIComponent(artist.id)}`);
  let media=el('div','tile-media');
  setImage(media,artist.thumbnail, 'Representative artwork to be supplied');
  link.append(media,el('h3','',artist.name));
  return link
}
function buildWorkCard(work,open) {
  let button=el('button','work-button tile');
  button.type='button';
  let pic=el('div','tile-media');
  setImage(pic,work.thumbnail||work.images?.[0]||'','Artwork image to be supplied');
  button.append(pic,el('h3','',work.title||'Untitled record'));
  button.addEventListener('click',()=>open(work.id,button));
  return button
}
function displayMessage(container,message) {
  container.replaceChildren(el('p','empty-note',message))
}
async function loadArtists() {
  let node=document.querySelector('#artists-grid');
  if(!node)return;
  try {
    const artists=await getData('artists');
    node.replaceChildren(...artists.map(buildArtistCard))
  }
  catch(e) {
    displayMessage(node,'Artists could not be loaded. Open the project through a local server or Cloudflare Pages.')
  }
}
async function loadProfile() {
  let heading=document.querySelector('#artist-title');
  if(!heading)return;
  try {
    let [artists,works]=await Promise.all([getData('artists'),getData('artworks')]);
    let id=new URLSearchParams(location.search).get('artist')||'jens-peeters';
    let a=artists.find(x=>x.id===id);
    if(!a) {
      heading.textContent='Artist not found';
      return
    }
    heading.textContent=a.name;
    document.title=a.name+' — Ludwig Schneider Gallery';
    document.querySelector('#artist-bio').textContent=a.biography||'Biography to be supplied.';
    setImage(document.querySelector('#artist-portrait'),a.portrait,'Archival image to be supplied');
    const related=works.filter(w=>w.artist===id);
    initWorks(related,document.querySelector('#profile-works'));
  }
  catch(e) {
    document.querySelector('#artist-bio').textContent='Unable to load the artist data. Use a local server or Cloudflare Pages.'
  }
}
async function loadCollection() {
  let node=document.querySelector('#collection-grid');
  if(!node)return;
  try {
    let works=await getData('artworks');
    initWorks(works,node);
    if(!works.length)displayMessage(node,'No artworks have been added yet. Add records to data/artworks.json and place images in assets/images/artworks/.')
  }
  catch(e) {
    displayMessage(node,'Collection data could not be loaded. Open the project through a local server or Cloudflare Pages.')
  }
}
function initWorks(works,node) {
  if(!works.length) {
    if(node.id==='profile-works')displayMessage(node,'Selected artworks will appear here once added to the collection.');
    return;
  }
  let dialog=document.querySelector('#artwork-overlay');
  node.replaceChildren(...works.map(w=>buildWorkCard(w,open)));
  let current=null,lastFocus=null,slide=0,hadArtworkParam=false;
  const closeBtn=dialog.querySelector('#close-work'),title=dialog.querySelector('#work-title'),details=dialog.querySelector('#work-facts'),desc=dialog.querySelector('#work-description'),stage=dialog.querySelector('#slide-stage'),thumbs=dialog.querySelector('#slide-thumbs'),prev=dialog.querySelector('#previous-slide'),next=dialog.querySelector('#next-slide'),share=dialog.querySelector('#share-work'),prevWork=dialog.querySelector('#previous-work'),nextWork=dialog.querySelector('#next-work');
  function artworkUrl(id) {
    const u=new URL(location.href);
    u.searchParams.set('artwork',id);
    return u
  }
  function paint() {
    let w=works.find(w=>w.id===current);
    if(!w)return;
    title.textContent=w.title||'Artwork title to be supplied';
    details.replaceChildren();
    for(let [label,value] of [['Artist',w.artist],['Year',w.year],['Medium',w.medium],['Dimensions',w.dimensions]]) {
      if(!value)continue;
      let line=el('div','fact');
      line.append(el('dt','',label),el('dd','',label==='Artist'?(window.artistNames?.[value]||value):value));
      details.append(line)
    }
    desc.textContent=w.description||'Description to be supplied.';
    let pictures=(w.images||[]).filter(Boolean);
    stage.replaceChildren();
    if(pictures.length) {
      let im=el('img');
      im.src=url(pictures[slide]);
      im.alt=(w.title||'Artwork')+` — image ${slide+1}`;
      stage.append(im)
    }
    else setImage(stage,'','Artwork images to be supplied');
    thumbs.replaceChildren();
    pictures.forEach((pic,i)=> {
      let b=el('button','mini');
      b.type='button';
      b.setAttribute('aria-label',`View image ${i+1}`);
      b.setAttribute('aria-pressed',String(i===slide));
      let image=el('img');
      image.src=url(pic);
      image.alt='';
      b.append(image);
      b.addEventListener('click',()=> {
        slide=i;
        paint()
      });
      thumbs.append(b)
    });
    prev.disabled=next.disabled=pictures.length<2;
    let position=works.findIndex(w=>w.id===current);
    prevWork.disabled=position<=0;
    nextWork.disabled=position>=works.length-1;
    share.textContent='↗  Share artwork';
  }
  function open(id,opener,fromUrl=false) {
    if(!works.some(w=>w.id===id))return;
    lastFocus=opener||document.activeElement;
    current=id;
    slide=0;
    dialog.hidden=false;
    document.body.classList.add('dialog-open');
    paint();
    closeBtn.focus();
    if(!fromUrl) {
      history.pushState( {
        artwork:id
      },'',artworkUrl(id));
    }
  }
  function close(update=true) {
    if(dialog.hidden)return;
    dialog.hidden=true;
    document.body.classList.remove('dialog-open');
    current=null;
    if(update) {
      let u=new URL(location.href);
      u.searchParams.delete('artwork');
      history.replaceState(null,'',u)
    }
    lastFocus?.focus?.();
  }
  function moveSlide(delta) {
    let count=works.find(w=>w.id===current)?.images?.filter(Boolean).length||0;
    if(count<2)return;
    slide=(slide+delta+count)%count;
    paint()
  }
  function moveWork(delta) {
    let i=works.findIndex(w=>w.id===current)+delta;
    if(i>=0&&i<works.length)open(works[i].id,lastFocus)
  }
  closeBtn.onclick=()=>close();
  dialog.addEventListener('click',e=> {
    if(e.target===dialog)close()
  });
  prev.onclick=()=>moveSlide(-1);
  next.onclick=()=>moveSlide(1);
  prevWork.onclick=()=>moveWork(-1);
  nextWork.onclick=()=>moveWork(1);
  share.onclick=async()=> {
    let w=works.find(w=>w.id===current);
    let link=artworkUrl(w.id).href;
    try {
      if(navigator.share) {
        await navigator.share( {
          title:w.title||'Artwork — Ludwig Schneider Gallery',url:link
        });
        return
      }
      await navigator.clipboard.writeText(link);
      share.textContent='✓ Link copied'
    }
    catch(e) {
      if(e.name==='AbortError')return;
      try {
        await navigator.clipboard.writeText(link);
        share.textContent='✓ Link copied'
      }
      catch {
        share.textContent='Copy the URL from your browser'
      }
    }
  };
  document.addEventListener('keydown',e=> {
    if(dialog.hidden)return;
    if(e.key==='Escape')close();
    if(e.key==='ArrowLeft')moveSlide(-1);
    if(e.key==='ArrowRight')moveSlide(1);
    if(e.key==='Tab') {
      let focusable=[...dialog.querySelectorAll('button:not([disabled])')];
      let i=focusable.indexOf(document.activeElement);
      if(e.shiftKey&&i===0) {
        e.preventDefault();
        focusable.at(-1).focus()
      }
      else if(!e.shiftKey&&i===focusable.length-1) {
        e.preventDefault();
        focusable[0].focus()
      }
    }
  });
  function sync() {
    let id=new URLSearchParams(location.search).get('artwork');
    if(id&&works.some(w=>w.id===id)) {
      open(id,null,true)
    }
    else close(false)
  }
  window.addEventListener('popstate',sync);
  sync();
}
Promise.all([getData('artists').then(a=>window.artistNames=Object.fromEntries(a.map(x=>[x.id,x.name]))).catch(()=> {
})]).then(()=> {
  loadArtists();
  loadProfile();
  loadCollection()
});
