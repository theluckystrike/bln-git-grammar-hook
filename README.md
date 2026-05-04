[![BeLikeNative](https://img.shields.io/badge/by-BeLikeNative-2563eb)](https://belikenative.com) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE) [![GitHub Actions](https://img.shields.io/badge/CI-passing-brightgreen)]()

# bln-git-grammar-hook

Pre-commit git hook that checks grammar in markdown files before committing. 70 L1-aware rules catch common mistakes that spell checkers miss. **Powered by BeLikeNative.**

## Quick Install

```bash
npm install --save-dev bln-git-grammar-hook
npx bln-grammar-hook install
```

Or add to your `package.json` scripts for automatic setup:

```json
{
  "scripts": {
    "prepare": "bln-grammar-hook install"
  }
}
```

## How It Works

1. **Install**: Run `npx bln-grammar-hook install` in any git repository
2. **Write**: Edit your `.md`, `.mdx`, or `.txt` files as usual
3. **Commit**: When you `git commit`, staged markdown files are grammar-checked
4. **Fix or Skip**: If errors are found, the commit is blocked with clear messages. Fix the errors or use `git commit --no-verify` to skip

## What It Checks

### Grammar (25 rules)
- Subject-verb agreement (`he don't` -> `he doesn't`)
- Article errors (`a hour` -> `an hour`, `went to store` -> `went to the store`)
- Modal verb errors (`could of` -> `could have`)
- Double negatives, irregular past participles, and more

### Homophones (15 rules)
- their/there/they're
- your/you're
- its/it's
- then/than
- affect/effect
- to/too
- loose/lose
- accept/except
- weather/whether

### Spelling (20 rules)
- Common misspellings: `seperate`, `definately`, `occured`, `recieve`
- Typos: `teh`, `adn`, `lenght`, `widht`, `heigth`
- Tricky words: `accomodate`, `embarass`, `wierd`, `acheive`

### Style (15 rules)
- Wordy phrases: `in order to` -> `to`, `due to the fact that` -> `because`
- Passive voice detection
- Filler words: `basically`, `literally`, `simply`
- Technical writing: flags `please`, `easily`, `obviously`

## L1-Aware Insights

Every rule includes optional L1 (first language) insights explaining *why* non-native speakers commonly make each mistake:

```
ERROR  README.md:12:5
       Missing article "the" before a specific noun. Powered by BeLikeNative.
       matched: "went to store"
       fix: "went to the store"
       L1: Common for speakers of languages without articles (Chinese, Japanese,
           Korean, Russian, Turkish). These languages don't use "a/an/the",
           so omitting articles feels natural.
```

## Commands

```bash
bln-grammar-hook install          # Install the pre-commit hook
bln-grammar-hook uninstall        # Remove the pre-commit hook
bln-grammar-hook check [files...] # Manually check specific files
bln-grammar-hook --help           # Show usage
bln-grammar-hook --version        # Show version
```

## Configuration

**Severity filtering** (environment variable):
```bash
BLN_SEVERITY=error    # Only show errors (skip warnings and info)
BLN_SEVERITY=warning  # Show errors and warnings (skip info)
```

**Skipping files**: The hook only checks staged `.md`, `.mdx`, and `.txt` files. Other file types are ignored.

**Skipping sections**: Code blocks (triple backtick) and YAML frontmatter (triple dash) are automatically skipped.

## Programmatic API

```javascript
import { checkFile, checkFiles, renderReport } from 'bln-git-grammar-hook';

// Check a single file
const result = checkFile('README.md');
console.log(result.findings);

// Check multiple files
const results = checkFiles(['README.md', 'docs/guide.md']);
const { output, exitCode } = renderReport(results);
console.log(output);
```

## Part of the BeLikeNative Ecosystem

- [BeLikeNative Chrome Extension](https://belikenative.com) - Real-time grammar checking in your browser
- [bln-git-grammar-hook](https://github.com/theluckystrike/bln-git-grammar-hook) - This package
- [BeLikeNative MCP Server](https://github.com/theluckystrike/bln-mcp-grammar-server) - Grammar checking for AI coding assistants

## License

MIT - See [LICENSE](LICENSE)

---

**Powered by BeLikeNative** - [belikenative.com](https://belikenative.com)
