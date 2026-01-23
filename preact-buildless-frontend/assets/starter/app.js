import { h, render } from 'preact';
import { signal } from '@preact/signals';
import htm from 'htm';

const html = htm.bind(h);
const count = signal(0);
const route = signal(location.hash.slice(1) || '/');
window.addEventListener('hashchange', () => {
  route.value = location.hash.slice(1) || '/';
});

function Nav() {
  return html`
    <nav>
      <a href="#/">Home</a>
      <a href="#/about">About</a>
    </nav>
  `;
}

function Home() {
  return html`
    <div>
      <h1>Home</h1>
      <p>Count: ${count}</p>
      <button onClick=${() => count.value++}>+1</button>
    </div>
  `;
}

function About() {
  return html`
    <div>
      <h1>About</h1>
      <p>A build-less ESM frontend.</p>
    </div>
  `;
}

function App() {
  const page = route.value;
  return html`
    <${Nav} />
    <main>
      ${page === '/about' ? html`<${About} />` : html`<${Home} />`}
    </main>
  `;
}

render(html`<${App} />`, document.getElementById('app'));
