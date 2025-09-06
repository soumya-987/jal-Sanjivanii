// script.js
// Handle CSV file reading and basic processing: find total cases and per-village totals

document.addEventListener('DOMContentLoaded',()=>{
  const fileInput=document.getElementById('csvFile');
  const processBtn=document.getElementById('processBtn');
  const resultDiv=document.getElementById('dataResult');
  if(!fileInput||!processBtn) return;

  processBtn.addEventListener('click',()=>{
    const file=fileInput.files[0];
    if(!file){
      alert('Please choose a CSV file first.');
      return;
    }
    const reader=new FileReader();
    reader.onload=e=>{
      const text=e.target.result;
      const rows=text.trim().split(/\r?\n/);
      if(rows.length<2){
        alert('CSV has no data rows');
        return;
      }
      const header=rows[0].split(',').map(h=>h.trim().toLowerCase());
      const villageIdx=header.indexOf('village');
      const casesIdx=header.indexOf('cases');
      if(villageIdx===-1||casesIdx===-1){
        alert('CSV must contain "village" and "cases" columns');
        return;
      }
      const totals={};
      let overall=0;
      for(let i=1;i<rows.length;i++){
        const cols=rows[i].split(',');
        const v=cols[villageIdx].trim();
        const c=parseInt(cols[casesIdx]);
        if(!isNaN(c)){
          overall+=c;
          totals[v]=(totals[v]||0)+c;
        }
      }
      let output=`Overall Cases: ${overall}\n\nPer Village:\n`;
      Object.entries(totals).forEach(([v,c])=>{
        output+=`${v}: ${c}\n`;
      });
      resultDiv.textContent=output;
    };
    reader.readAsText(file);
  });
});