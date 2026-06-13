const puppeteer = require('puppeteer');
const fs = require('fs');

const html = `
<!DOCTYPE html>
<html>
<head>
  <script src='https://cdn.tailwindcss.com'></script>
  <style>
    body { background: #f3f4f6; display: flex; justify-content: center; padding: 2rem; }
  </style>
</head>
<body>
  <div class='bg-white text-black w-[210mm] min-h-[148mm] h-max border border-black flex flex-col text-[10px] shadow-xl' style='font-family: Arial, sans-serif'>
    <div class='flex border-b border-black'>
      <div class='w-[25%] p-1.5 border-r border-black leading-tight flex flex-col justify-center'>
        <p><span class='font-bold'>Name :</span> John Doe</p>
        <p><span class='font-bold'>Phone :</span> 9876543210</p>
        <p><span class='font-bold'>Address :</span> Hyderabad</p>
        <p><span class='font-bold'>GST :</span> </p>
      </div>
      
      <div class='w-[50%] p-1.5 text-center flex flex-col justify-center items-center relative'>
        <h1 class='text-xl font-black tracking-tight uppercase'>SHREE MAHA GANESH JEWELLERS</h1>
        <p class='text-[9px] mt-0.5'>Shop No. 4 & 5, Sindhu Nilayam, Sri Ram Nagar Colony, Gangaram, Chandanagar, Hyderabad-50. TG.</p>
        <p class='text-[9px] font-bold mt-0.5'>📞 809666199 📞 9014659444</p>
      </div>
      
      <div class='w-[25%] p-1.5 border-l border-black text-right leading-tight flex flex-col justify-center'>
        <p><span class='font-bold'>Date :</span> 6/12/2026</p>
        <p><span class='font-bold'>Invoice No :</span> INV-1024</p>
        <p><span class='font-bold'>GSTIN :</span> 36AETFS3971D1ZK</p>
      </div>
    </div>
    
    <div class='text-center font-bold uppercase tracking-widest text-[11px] py-0.5 border-b border-black bg-gray-50'>
      GST - INVOICE
    </div>
    
    <table class='w-full text-[9px] border-collapse'>
      <thead class='border-b border-black bg-gray-50'>
        <tr>
          <th class='border-r border-black py-1 px-1 text-center w-8'>Sno</th>
          <th class='border-r border-black py-1 px-1 text-left'>Description</th>
          <th class='border-r border-black py-1 px-1 text-center'>HSN Code</th>
          <th class='border-r border-black py-1 px-1 text-center w-8'>Qty</th>
          <th class='border-r border-black py-1 px-1 text-right'>Gross Wt.<br/><span class='text-[7px] font-normal'>Grams</span></th>
          <th class='border-r border-black py-1 px-1 text-right'>Net Wt.<br/><span class='text-[7px] font-normal'>Grams</span></th>
          <th class='border-r border-black py-1 px-1 text-right'>Rate<br/><span class='text-[7px] font-normal'>/Gram</span></th>
          <th class='border-r border-black py-1 px-1 text-right'>VA</th>
          <th class='border-r border-black py-1 px-1 text-right'>St. Amt.</th>
          <th class='py-1 px-1 text-right'>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr class='border-b border-black'>
          <td class='border-r border-black py-1 px-1 text-center'>1</td>
          <td class='border-r border-black py-1 px-1'>
            <div class='font-bold'>Gold Ring</div>
            <div class='text-[7px] text-gray-600'>22K 1000123</div>
          </td>
          <td class='border-r border-black py-1 px-1 text-center'>7113</td>
          <td class='border-r border-black py-1 px-1 text-center'>1</td>
          <td class='border-r border-black py-1 px-1 text-right'>5.500</td>
          <td class='border-r border-black py-1 px-1 text-right'>5.500</td>
          <td class='border-r border-black py-1 px-1 text-right'>6500</td>
          <td class='border-r border-black py-1 px-1 text-right'>1500</td>
          <td class='border-r border-black py-1 px-1 text-right'>0</td>
          <td class='py-1 px-1 text-right font-bold'>37250.00</td>
        </tr>
      </tbody>
    </table>

    <div class='flex-1'></div>

    <div class='flex border-t border-black mt-auto'>
      <div class='w-[75%] border-r border-black flex flex-col'>
        <div class='flex border-b border-black flex-1'>
          <div class='w-[50%] p-1.5 border-r border-black text-[9px] leading-tight flex flex-col'>
            <p><span class='font-bold'>SMID :</span> EMP101</p>
            <p class='mt-1 uppercase'>IN WORDS : <span class='font-bold'>THIRTY EIGHT THOUSAND THREE HUNDRED SIXTY SEVEN RUPEES</span></p>
            <p class='mt-auto font-bold uppercase'>CASH : 38367.50/-</p>
          </div>
          <div class='w-[50%] p-1.5 text-[8px] leading-tight'>
            <p class='font-bold underline mb-0.5'>Terms and Conditions</p>
            <ol class='list-decimal pl-3 space-y-0.5'>
              <li>AFTER 2 DAYS NO EXCHANGE - NO CASH REFUND</li>
              <li>VA, MAKING CHARGES AND GST MANDATORY</li>
              <li>No Guarantee For Breakage, Durability and Falling of Stones</li>
            </ol>
          </div>
        </div>
        
        <div class='flex justify-between items-end p-2 pb-1 mt-auto text-[9px] h-[50px]'>
          <div class='w-1/3 flex items-end'>
            <div><p class='border-t border-black pt-0.5 inline-block'>Customer Sign</p></div>
          </div>
          <div class='w-1/3 text-center font-bold tracking-wider mb-1'>THANK YOU *** VISIT AGAIN</div>
          <div class='w-1/3 text-right flex flex-col justify-between items-end h-full'>
            <p>For SHREE MAHA GANESH JEWELLERS</p>
            <p class='border-t border-black pt-0.5 inline-block'>Authorized Sign</p>
          </div>
        </div>
      </div>
      
      <div class='w-[25%] text-[10px] flex flex-col justify-end'>
        <div class='flex justify-between p-1 border-b border-black'>
          <span>Discount :</span><span>-0.00</span>
        </div>
        <div class='flex justify-between p-1 border-b border-black bg-gray-50'>
          <span>Taxable :</span><span>37250.00</span>
        </div>
        <div class='flex justify-between p-1 border-b border-black'>
          <span>CGST :</span><span>558.75</span>
        </div>
        <div class='flex justify-between p-1 border-b border-black'>
          <span>SGST :</span><span>558.75</span>
        </div>
        <div class='flex justify-between p-1.5 bg-gray-100'>
          <span class='font-bold'>Net Total :</span><span class='font-bold text-[11px]'>38367.50</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({width: 1000, height: 800, deviceScaleFactor: 2});
  await page.setContent(html, {waitUntil: 'networkidle0'});
  await page.screenshot({path: 'C:/Users/omkas/.gemini/antigravity/brain/ec8122f6-bc4a-4f2c-a828-35dba07155ff/invoice_preview2.png', fullPage: true});
  await browser.close();
  console.log('Done');
})();
