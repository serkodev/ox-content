(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))l(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const o of t.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&l(o)}).observe(document,{childList:!0,subtree:!0});function r(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function l(e){if(e.ep)return;e.ep=!0;const t=r(e);fetch(e.href,t)}})();const c=`<div class="ox-content"><h1 id="ox-content-ssg-example">Ox Content SSG Example</h1>

<p>Welcome to the <strong>Ox Content</strong> SSG example! This demonstrates how to use Ox Content with Vite's Environment API for static site generation.</p>

<h2 id="features">Features</h2>

<p>This example showcases:</p>

<ul>
<li><strong>Markdown Transformation</strong> - Automatic conversion to JavaScript modules</li>
<li><strong>Frontmatter Parsing</strong> - YAML frontmatter support</li>
<li><strong>Table of Contents</strong> - Auto-generated navigation</li>
<li><strong>Hot Module Replacement</strong> - Live updates during development</li>
<li><strong>GFM Support</strong> - GitHub Flavored Markdown features</li>
</ul>

<h2 id="code-example">Code Example</h2>

<p>Here's how you import Markdown files:</p>

<pre class="shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#F97583">import</span><span style="color:#E1E4E8"> content </span><span style="color:#F97583">from</span><span style="color:#9ECBFF"> './content/index.md'</span><span style="color:#E1E4E8">;</span></span>
<span class="line"></span>
<span class="line"><span style="color:#6A737D">// Access the rendered HTMLconsole.log(content.html);</span></span>
<span class="line"></span>
<span class="line"><span style="color:#6A737D">// Access frontmatter dataconsole.log(content.frontmatter.title);</span></span>
<span class="line"></span>
<span class="line"><span style="color:#6A737D">// Access table of contents</span></span>
<span class="line"><span style="color:#E1E4E8">content.toc.</span><span style="color:#B392F0">forEach</span><span style="color:#E1E4E8">(</span><span style="color:#FFAB70">entry</span><span style="color:#F97583"> =></span><span style="color:#E1E4E8"> {</span></span>
<span class="line"><span style="color:#E1E4E8">  console.</span><span style="color:#B392F0">log</span><span style="color:#E1E4E8">(entry.text, entry.slug);</span></span>
<span class="line"><span style="color:#E1E4E8">});</span></span></code></pre>

<h2 id="task-lists">Task Lists</h2>

<ul class="task-list">
<li class="task-list-item"><input type="checkbox" checked disabled> Setup Vite project</li>
<li class="task-list-item"><input type="checkbox" checked disabled> Install vite-plugin-ox-content</li>
<li class="task-list-item"><input type="checkbox" checked disabled> Create Markdown content</li>
<li class="task-list-item"><input type="checkbox" disabled> Deploy to production</li>
</ul>

<h2 id="links-and-resources">Links and Resources</h2>

<ul>
<li><a href="https://github.com/ubugeeei/ox-content">Ox Content Documentation</a></li>
<li><a href="https://vitejs.dev/guide/api-environment.html">Vite Environment API</a></li>
</ul>

<h2 id="conclusion">Conclusion</h2>

<p>The Vite Environment API provides a powerful foundation for building SSG tools. Combined with Ox Content's high-performance Markdown parsing, you can build lightning-fast documentation sites.</p></div>`,p=[{depth:1,text:"Ox Content SSG Example",slug:"ox-content-ssg-example",children:[{depth:2,text:"Features",slug:"features",children:[]},{depth:2,text:"Code Example",slug:"code-example",children:[]},{depth:2,text:"Task Lists",slug:"task-lists",children:[]},{depth:2,text:"Links and Resources",slug:"links-and-resources",children:[]},{depth:2,text:"Conclusion",slug:"conclusion",children:[]}]}],a={html:c,toc:p},i=document.getElementById("app");i&&(i.innerHTML=`
    <nav class="toc">
      <h2>Table of Contents</h2>
      <ul>
        ${a.toc.map(n=>`
          <li>
            <a href="#${n.slug}">${n.text}</a>
            ${n.children.length>0?`
              <ul>
                ${n.children.map(s=>`
                  <li><a href="#${s.slug}">${s.text}</a></li>
                `).join("")}
              </ul>
            `:""}
          </li>
        `).join("")}
      </ul>
    </nav>
    <main class="content">
      ${a.html}
    </main>
  `);
