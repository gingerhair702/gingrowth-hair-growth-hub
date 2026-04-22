(function(){
  function norm(s){return (s||"").toString().toLowerCase().trim();}
  var input=document.querySelector('[data-role="search"]');
  if(!input) return;
  var items=[].slice.call(document.querySelectorAll('[data-role="item"]'));
  input.addEventListener('input', function(){
    var q=norm(input.value);
    items.forEach(function(el){
      var hay=norm(el.getAttribute('data-search'));
      el.classList.toggle('hidden', q && hay.indexOf(q)===-1);
    });
  });
})();