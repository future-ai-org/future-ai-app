# Future AI

<br>

> A prediction platform with integration with astro data and built with Next.js 16, React 19, and TypeScript.

<br>

## 🛠️ Running Locally

<br>

#### Development

```bash
make install &&  dev
```

Open [http://localhost:8066](http://localhost:8066).

<br>

---

##  🚧 Project Retired

<br>

- This project is no longer actively maintained — I simply don't have the time to keep working on it. 

- If you'd like to pick up the idea or build on the existing code, please go for it! (some credit would be appreciated). Here's roughly where things stood and what would need to happen next:

1. Training / Fine-tuning the AI for Astro

- Curate a solid dataset of stro-specific code — components, layouts, integrations, config files, etc.
- Fine-tune a base model (e.g. Code Llama, DeepSeek Coder, or similar) on that dataset.
- Create an automatic pipeline to feed the predictions questions and their astro guesses.

2. Infra, Deployment, etc.

- Create a better way to feed the questions, automatically close on expiration, etc. (perhaps do this through smart contracts and web3 integration).
- Set up a scalable serving infrastructure (e.g. Modal, Replicate, RunPod, or a self-hosted GPU setup).
- Build out an API layer so the model can be queried reliably.
- Improve authentication, rate limiting, and abuse prevention.
- Set up CI/CD so model updates can be rolled out without downtime.
- Monitoring and logging so you can catch regressions or failures early.

