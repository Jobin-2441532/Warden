const fs = require('fs');
let content = fs.readFileSync('app/(marketing)/page.tsx', 'utf8');

// Replace fonts
content = content.split('font-serif').join('font-heading font-bold tracking-tight');

// Replace accent in light sections
content = content.split('text-accent').join('text-foreground');

// Fix inverted section background (was bg-foreground, now that foreground is black, let's keep it black but fix the icons)
content = content.split('className="text-foreground shrink-0 mt-0.5"').join('className="text-background shrink-0 mt-0.5"');

// Fix terminal mock
content = content.split('bg-[#1e2a35] rounded-2xl').join('bg-white rounded-[2rem] shadow-sm');
content = content.split('border border-white/10 shadow-2xl relative overflow-hidden').join('border border-black/5 relative overflow-hidden');
content = content.split('bg-gradient-to-r from-accent to-accent/20').join('bg-gradient-to-r from-black to-black/20');
content = content.split('bg-gradient-to-r from-foreground to-foreground/20').join('bg-gradient-to-r from-black to-black/20');

content = content.split('bg-[#243340] rounded-xl p-4 border-l-4 border-l-accent flex flex-col gap-4').join('bg-background rounded-xl p-4 border-l-4 border-l-black flex flex-col gap-4 shadow-sm');
content = content.split('bg-[#243340] rounded-xl p-4 border-l-4 border-l-foreground flex flex-col gap-4').join('bg-background rounded-xl p-4 border-l-4 border-l-black flex flex-col gap-4 shadow-sm');

content = content.split('bg-[#243340] rounded-xl p-4 border-l-4 border-l-danger flex flex-col gap-4').join('bg-background rounded-xl p-4 border-l-4 border-l-danger flex flex-col gap-4 shadow-sm');

content = content.split('font-mono text-white/50').join('font-mono text-muted text-xs');
content = content.split('bg-accent/20 text-foreground text-xs').join('bg-black/10 text-black text-[10px]');
content = content.split('bg-foreground/20 text-foreground text-xs').join('bg-black/10 text-black text-[10px]');
content = content.split('bg-[#1e2a35] p-3 rounded text-xs font-mono text-white/70').join('bg-white p-3 rounded-lg text-[11px] font-mono text-muted');

// Fix CheckCircle2 colors in the mock
content = content.split('<CheckCircle2 size={14} className="text-foreground mt-0.5" />').join('<CheckCircle2 size={14} className="text-black mt-0.5" />');

fs.writeFileSync('app/(marketing)/page.tsx', content, 'utf8');
console.log('Done!');
