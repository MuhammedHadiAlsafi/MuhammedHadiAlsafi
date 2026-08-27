const fs = require("fs");
const path = require("path");

const USERNAME = process.env.GH_USERNAME;
const COUNT = 5;                    // listelenecek repo sayısı
const EXCLUDE = [USERNAME];         // profil reposunu listeleme
const README = path.join(process.cwd(), "README.md");
const START = "<!--START_SECTION:projects-->";
const END = "<!--END_SECTION:projects-->";

async function main() {
  const res = await fetch(
    `https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=100`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    }
  );

  if (!res.ok) throw new Error(`GitHub API hatası: ${res.status}`);

  const repos = (await res.json())
    .filter((r) => !r.fork && !r.archived && !EXCLUDE.includes(r.name))
    .slice(0, COUNT);

  const rows = repos
    .map((r) => {
      const desc = r.description || "—";
      const lang = r.language || "—";
      const date = new Date(r.pushed_at).toLocaleDateString("tr-TR");
      return `| [${r.name}](${r.html_url}) | ${desc} | ${lang} | ⭐ ${r.stargazers_count} | ${date} |`;
    })
    .join("\n");

  const table =
    "| Proje | Açıklama | Dil | Yıldız | Son Güncelleme |\n" +
    "| :--- | :--- | :--- | :--- | :--- |\n" +
    rows;

  const readme = fs.readFileSync(README, "utf8");
  const pattern = new RegExp(`${START}[\\s\\S]*?${END}`);
  const updated = readme.replace(pattern, `${START}\n${table}\n${END}`);

  if (updated !== readme) {
    fs.writeFileSync(README, updated);
    console.log("README güncellendi.");
  } else {
    console.log("Değişiklik yok.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});