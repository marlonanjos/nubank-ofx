(function() {

  const startOfx = () => {
    return `
OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>`;
  }

  const endOfx = () =>
    `
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;

  const bankStatement = (date, amount, description) =>
    `
          <STMTTRN>
            <TRNTYPE>OTHER</TRNTYPE>
            <DTPOSTED>${date}</DTPOSTED>
            <TRNAMT>${amount * -1}</TRNAMT>
            <MEMO>${description}</MEMO>
          </STMTTRN>`;

  const normalizeAmount = (text) =>
    text.replace('.', '').replace(',','.');

  const normalizeDay = (date) =>
    date.split(' ')[0];

  const normalizeMonth = (date) => {
    // Expected values:
    // For current year, December: Dez
    // For past years, December: Dez 19, Dez 18
    // Dont know if they have other languages
    
    const month = date.split(' ')[1]
    const months = {
      'Jan': '01',
      'Fev': '02',
      'Mar': '03',
      'Abr': '04',
      'Mai': '05',
      'Jun': '06',
      'Jul': '07',
      'Ago': '08',
      'Set': '09',
      'Out': '10',
      'Nov': '11',
      'Dez': '12'
    }

    return months[month];
  }

  const normalizeYear = (date) => {
    // Expected values:
    // For current year, December: Dez
    // For past years, December: Dez 19, Dez 18
    // Only interested on the year

    const dateArray = date.split(' ');
    if (dateArray.length > 2) {
      return '20'+dateArray[2];
    } else {
      return new Date().getFullYear();
    };
  }

  const normalizeDate = (date) =>
    normalizeYear(date)+normalizeMonth(date)+normalizeDay(date);

  const exportOfx = (ofx) => {
    const openMonth = " " + document.querySelector('md-tab.ng-scope.active .period').textContent.trim();
    const period = normalizeYear(openMonth) + "-" + normalizeMonth(openMonth);
    link = document.createElement("a");
    link.setAttribute("href", 'data:application/x-ofx,'+encodeURIComponent(ofx));
    link.setAttribute("download", "nubank-" + period + ".ofx");
    link.click();
  }

  const generateOfx = (event) => {
    const tabId = '#content_tab_' + event.target.getAttribute('role').split('-')[2];
    
    let ofx = startOfx();
    
    document.querySelectorAll(`${tabId} .charge:not([style='display:none'])`).forEach(function(charge){
      const date = normalizeDate(charge.querySelector('.time').textContent);
      const description = charge.querySelector('.description').textContent.trim();
      const amount = normalizeAmount(charge.querySelector('.amount').textContent);

      ofx += bankStatement(date, amount, description);
    });

    ofx += endOfx();
    exportOfx(ofx);
  }

  const createExportButton = (tabId) => {
    const button = document.createElement('button');

    button.classList.add('nu-button');
    button.classList.add('secondary');
    button.setAttribute('role', 'gen-ofx-'+tabId);
    button.textContent = "Exportar para OFX+";

    button.addEventListener('click', generateOfx)

    return button;
  }
  
  const exportOfxButtonAlreadyExists = (tabId) =>
    document.querySelectorAll(".summary [role=\"gen-ofx-"+tabId+"\"]").length > 0

  const insertExportButtonCallback = (mutationList, observer) => {
    
    if(mutationList == undefined) return;

    
    for(let mutation of mutationList) {
      if (mutation.target.classList.contains('summary')) {
        const tab = mutation.target.parentElement.parentElement.id; // expected content_tab_01N
        if (tab.split('_').length > 2 && tab.split('_')[2].length === 3)
          tabId = tab.split('_')[2];
          if(!exportOfxButtonAlreadyExists(tabId)) {
            const exportOfxButton =  createExportButton(tabId);
            mutation.target.appendChild(exportOfxButton);
          }

      // Last node, time to disconnect...
      if (mutation.target.classList.contains('open-add')&&mutation.target.classList.contains('summary')) {
        observer.disconnect();
      }
      }


    }


  }
  


  const targetElement = document.querySelector('.ng-scope');
  const config = { attributes: false, childList: true, subtree: true }
  
  const observer = new MutationObserver(insertExportButtonCallback);
  observer.observe(targetElement, config)
  
})();

