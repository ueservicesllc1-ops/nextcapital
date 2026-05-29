const fs = require('fs');

function htmlToJsx(html) {
  let jsx = html;
  
  // class to className
  jsx = jsx.replace(/class=/g, 'className=');
  // for to htmlFor
  jsx = jsx.replace(/for=/g, 'htmlFor=');
  // self close tags
  jsx = jsx.replace(/<img([^>]+[^\/])>/g, '<img$1 />');
  jsx = jsx.replace(/<input([^>]+[^\/])>/g, '<input$1 />');
  jsx = jsx.replace(/<br([^>]*[^\/])?>/g, '<br />');
  jsx = jsx.replace(/<hr([^>]*[^\/])?>/g, '<hr />');
  
  // simple style replacement (just remove them or fix basic ones)
  jsx = jsx.replace(/style=`([^>]+)`/g, '');
  jsx = jsx.replace(/style="([^"]+)"/g, '');
  jsx = jsx.replace(/style='([^']+)'/g, '');
  
  // comments
  jsx = jsx.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');

  // SVG fixes (stroke-width to strokeWidth, etc)
  jsx = jsx.replace(/stroke-width/g, 'strokeWidth');
  jsx = jsx.replace(/stroke-linecap/g, 'strokeLinecap');
  jsx = jsx.replace(/stroke-linejoin/g, 'strokeLinejoin');
  jsx = jsx.replace(/fill-rule/g, 'fillRule');
  jsx = jsx.replace(/clip-rule/g, 'clipRule');
  jsx = jsx.replace(/font-variation-settings/g, 'fontVariationSettings');

  return jsx;
}

const landingHtml = fs.readFileSync('stitch/core_mining_landing_page_updated_plans/code.html', 'utf8');
const landingMatch = landingHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
let landingBody = landingMatch ? landingMatch[1] : '';
landingBody = htmlToJsx(landingBody);

const pageTsx = `
import Link from 'next/link';

export default function MinadoLandingPage() {
  return (
    <>
      ${landingBody}
    </>
  );
}
`;

fs.writeFileSync('src/app/minado/page.tsx', pageTsx);

const dashHtml = fs.readFileSync('stitch/core_mining_dashboard_updated_yields/code.html', 'utf8');
const dashMatch = dashHtml.match(/<body[^>]*>([\s\S]*?)<script>/i);
let dashBody = dashMatch ? dashMatch[1] : '';
dashBody = htmlToJsx(dashBody);

// In the dashboard, we want to replace static numbers with state variables
dashBody = dashBody.replace('485.2', '{hashRate}');
dashBody = dashBody.replace('1.4092', '{earnings.toFixed(6)}');

const dashTsx = `
'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function MinadoDashboardPage() {
  const [hashRate, setHashRate] = useState(485.2);
  const [earnings, setEarnings] = useState(1.4092);

  // Faux simulation hook
  useEffect(() => {
    const interval = setInterval(() => {
      // Fluctuate hashrate slightly
      setHashRate(prev => {
        const fluctuate = (Math.random() - 0.5) * 5;
        return Number((prev + fluctuate).toFixed(2));
      });
      // Increase earnings
      setEarnings(prev => {
        // approx 0.75% to 1.10% variation per tick (scaled down for live effect)
        const rate = 0.0000001 * (0.75 + Math.random() * 0.35);
        return Number((prev + rate).toFixed(8));
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="minado-dashboard-container h-full w-full">
      ${dashBody}
    </div>
  );
}
`;

fs.writeFileSync('src/app/minado/dashboard/page.tsx', dashTsx);
console.log('Done converting html to jsx');
