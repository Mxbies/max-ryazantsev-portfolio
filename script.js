const cursor=document.querySelector('.cursor');
if(cursor){
  window.addEventListener('mousemove',e=>{cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px';cursor.style.opacity=1});
  document.addEventListener('mouseleave',()=>cursor.style.opacity=0);
}
const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')});
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

document.querySelectorAll('.skill').forEach(skill=>{
  skill.addEventListener('mouseenter',()=>{
    const note=document.querySelector('.skill-note');
    if(note) note.textContent=skill.dataset.note || 'SKILL';
  });
  skill.addEventListener('mouseleave',()=>{
    const note=document.querySelector('.skill-note');
    if(note) note.textContent='HOVER A SKILL';
  });
});
