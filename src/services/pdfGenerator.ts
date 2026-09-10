import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AppSettings, MonthData } from '../types';
import { formatMonthLabel, formatTaka } from './storage';

export async function exportMonthToPDF(
  ym: string,
  data: MonthData,
  settings: AppSettings,
  onProgress?: (msg: string) => void
): Promise<void> {
  onProgress?.('পিডিএফ রিপোর্ট তৈরি হচ্ছে...');

  const totalAdv = data.advances.reduce((s, a) => s + Number(a.amount || 0), 0);
  const totalCost = data.costs.reduce((s, c) => s + Number(c.amount || 0), 0);
  const balance = totalAdv - totalCost;

  let whoGets = 'হিসাব সমান';
  let whoColor = '#3a3f4d';
  if (balance > 0) {
    whoGets = `${settings.uncleName} পাবে`;
    whoColor = '#e0623f';
  } else if (balance < 0) {
    whoGets = `${settings.myName} পাবে`;
    whoColor = '#0f9d74';
  }

  // Create an offscreen, beautifully styled A4 report container
  const reportDiv = document.createElement('div');
  reportDiv.style.position = 'fixed';
  reportDiv.style.left = '-9999px';
  reportDiv.style.top = '0';
  reportDiv.style.width = '794px'; // 210mm at 96 DPI
  reportDiv.style.minHeight = '1123px'; // A4 height
  reportDiv.style.padding = '40px';
  reportDiv.style.backgroundColor = '#ffffff';
  reportDiv.style.color = '#131722';
  reportDiv.style.fontFamily = "'Hind Siliguri', 'Inter', sans-serif";
  reportDiv.style.boxSizing = 'border-box';

  const monthLabel = formatMonthLabel(ym);
  const dateStr = new Date().toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = new Date().toLocaleTimeString('bn-BD', {
    hour: '2-digit',
    minute: '2-digit',
  });

  reportDiv.innerHTML = `
    <div style="border-bottom: 2px solid #3151e0; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <h1 style="font-size: 26px; font-weight: 700; margin: 0 0 4px; color: #131722;">Hishab Tracker</h1>
        <p style="font-size: 14px; color: #667085; margin: 0;">মাসিক হিসাবের বিবরণী: <strong style="color: #3151e0;">${monthLabel}</strong></p>
      </div>
      <div style="text-align: right; font-size: 12px; color: #8892a0;">
        <div>রিপোর্ট তৈরির তারিখ: ${dateStr}</div>
        <div>সময়: ${timeStr}</div>
      </div>
    </div>

    <!-- Summary Box -->
    <div style="background: #131722; color: #ffffff; border-radius: 14px; padding: 20px 24px; margin-bottom: 26px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div>
          <div style="font-size: 13px; color: #a9afc0; margin-bottom: 4px;">এই মাসের সর্বমোট ব্যালেন্স</div>
          <div style="font-size: 32px; font-weight: 700; font-family: monospace;">${formatTaka(Math.abs(balance))}</div>
        </div>
        <div style="background: ${whoColor}; color: #ffffff; padding: 6px 16px; border-radius: 999px; font-size: 14px; font-weight: 600;">
          ${whoGets}
        </div>
      </div>
      <div style="display: flex; gap: 32px; border-top: 1px solid #2c3040; padding-top: 14px;">
        <div>
          <span style="font-size: 12px; color: #8f95a6;">মোট অগ্রিম: </span>
          <strong style="font-size: 15px; color: #688bf5; font-family: monospace;">${formatTaka(totalAdv)}</strong>
        </div>
        <div>
          <span style="font-size: 12px; color: #8f95a6;">মোট খরচ: </span>
          <strong style="font-size: 15px; color: #f88f72; font-family: monospace;">${formatTaka(totalCost)}</strong>
        </div>
        <div>
          <span style="font-size: 12px; color: #8f95a6;">মোট এন্ট্রি সংখ্যা: </span>
          <strong style="font-size: 15px; color: #ffffff;">${data.advances.length + data.costs.length} টি</strong>
        </div>
      </div>
    </div>

    <!-- Advances Table -->
    <div style="margin-bottom: 26px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="font-size: 16px; font-weight: 700; color: #3151e0; margin: 0;">১. অগ্রিমের তালিকা (Advances)</h3>
        <span style="font-size: 13px; font-weight: 600; color: #3151e0; background: #eaefff; padding: 3px 10px; border-radius: 999px;">
          মোট: ${formatTaka(totalAdv)}
        </span>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
        <thead>
          <tr style="background: #f4f5f8; border-bottom: 1.5px solid #d0d5dd;">
            <th style="padding: 10px; width: 45px;">ক্রমিক</th>
            <th style="padding: 10px;">কাস্টমারের নাম</th>
            <th style="padding: 10px;">বিস্তারিত</th>
            <th style="padding: 10px; text-align: right; width: 120px;">টাকা</th>
          </tr>
        </thead>
        <tbody>
          ${
            data.advances.length === 0
              ? '<tr><td colspan="4" style="padding: 14px; text-align: center; color: #98a2b3; font-style: italic;">কোনো অগ্রিম নেই</td></tr>'
              : data.advances
                  .map(
                    (a, i) => `
            <tr style="border-bottom: 1px solid #eaecf0;">
              <td style="padding: 9px 10px; color: #667085;">${i + 1}</td>
              <td style="padding: 9px 10px; font-weight: 600; color: #131722;">${escapeXml(a.name)}</td>
              <td style="padding: 9px 10px; color: #667085;">${escapeXml(a.detail || '-')}</td>
              <td style="padding: 9px 10px; text-align: right; font-weight: 700; font-family: monospace;">${formatTaka(a.amount)}</td>
            </tr>
          `
                  )
                  .join('')
          }
        </tbody>
        <tfoot>
          <tr style="background: #fafbfc; font-weight: 700;">
            <td colspan="3" style="padding: 10px; text-align: right;">সর্বমোট অগ্রিম:</td>
            <td style="padding: 10px; text-align: right; font-family: monospace; color: #3151e0;">${formatTaka(totalAdv)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Costs Table -->
    <div style="margin-bottom: 30px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="font-size: 16px; font-weight: 700; color: #e0623f; margin: 0;">২. বাড়তি খরচের তালিকা (Extra Costs)</h3>
        <span style="font-size: 13px; font-weight: 600; color: #e0623f; background: #fdeee9; padding: 3px 10px; border-radius: 999px;">
          মোট: ${formatTaka(totalCost)}
        </span>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
        <thead>
          <tr style="background: #f4f5f8; border-bottom: 1.5px solid #d0d5dd;">
            <th style="padding: 10px; width: 45px;">ক্রমিক</th>
            <th style="padding: 10px;" colspan="2">খরচের বিবরণ</th>
            <th style="padding: 10px; text-align: right; width: 120px;">টাকা</th>
          </tr>
        </thead>
        <tbody>
          ${
            data.costs.length === 0
              ? '<tr><td colspan="4" style="padding: 14px; text-align: center; color: #98a2b3; font-style: italic;">কোনো খরচ নেই</td></tr>'
              : data.costs
                  .map(
                    (c, i) => `
            <tr style="border-bottom: 1px solid #eaecf0;">
              <td style="padding: 9px 10px; color: #667085;">${i + 1}</td>
              <td style="padding: 9px 10px; font-weight: 600; color: #131722;" colspan="2">${escapeXml(c.detail)}</td>
              <td style="padding: 9px 10px; text-align: right; font-weight: 700; font-family: monospace;">${formatTaka(c.amount)}</td>
            </tr>
          `
                  )
                  .join('')
          }
        </tbody>
        <tfoot>
          <tr style="background: #fafbfc; font-weight: 700;">
            <td colspan="3" style="padding: 10px; text-align: right;">সর্বমোট খরচ:</td>
            <td style="padding: 10px; text-align: right; font-family: monospace; color: #e0623f;">${formatTaka(totalCost)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Signature / Verification Area -->
    <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 30px; border-top: 1px dashed #d0d5dd; font-size: 12px; color: #667085;">
      <div style="text-align: center; width: 180px;">
        <div style="border-bottom: 1px solid #98a2b3; height: 35px; margin-bottom: 6px;"></div>
        <div>${settings.myName} (স্বাক্ষর)</div>
      </div>
      <div style="text-align: center; width: 180px;">
        <div style="border-bottom: 1px solid #98a2b3; height: 35px; margin-bottom: 6px;"></div>
        <div>${settings.uncleName} (স্বাক্ষর)</div>
      </div>
    </div>

    <div style="text-align: center; margin-top: 40px; font-size: 11px; color: #98a2b3;">
      Hishab Tracker • Developed by Tasin • স্বয়ংক্রিয় ডিজিটাল হিসাব ব্যাকআপ রিপোর্ট
    </div>
  `;

  document.body.appendChild(reportDiv);

  try {
    // Render to canvas with scale 2 for crisp vector-like text
    const canvas = await html2canvas(reportDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // A4: 210mm x 297mm
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Scale canvas to fit A4 width
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Handle multiple pages if very long
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const fileName = `hishab-report-${ym}.pdf`;
    pdf.save(fileName);
    onProgress?.('পিডিএফ সফলভাবে ডাউনলোড হয়েছে!');
  } finally {
    document.body.removeChild(reportDiv);
  }
}

function escapeXml(str: string): string {
  return (str || '').replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return m;
    }
  });
}
