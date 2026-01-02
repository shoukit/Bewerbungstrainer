# Troubleshooting Guide

This document provides solutions for common issues you might encounter while working with the Bewerbungstrainer application.

## Build Issues

### Error: "Rollup failed to resolve import [package-name]"

**Symptoms:**
- Build fails with error: `Rollup failed to resolve import "react-router-dom"` or similar
- The package is not actually used in your code
- Development mode works fine, but production build fails

**Root Cause:**
This error typically occurs when there are cached build artifacts or stale `node_modules` from a previous version of the code that used different dependencies.

**Solution:**

1. **Quick Fix - Clear cache and rebuild:**
   ```bash
   npm run rebuild
   ```

2. **Full Clean - Remove everything and reinstall:**
   ```bash
   npm run fresh
   npm run build
   ```

3. **Manual Steps (if scripts don't work):**
   ```bash
   # Remove all build artifacts and dependencies
   rm -rf node_modules dist .vite

   # Reinstall dependencies
   npm install

   # Try building again
   npm run build
   ```

### Error: "vite: not found"

**Symptoms:**
- Running `npm run build` or `npm run dev` fails with "vite: not found"

**Solution:**
Dependencies are not installed. Run:
```bash
npm install
```

## Development Issues

### Changes not showing up in development mode

**Solution:**
1. Stop the dev server (Ctrl+C)
2. Clear Vite cache: `npm run clean:cache`
3. Restart dev server: `npm run dev`

### Port 5173 already in use

**Solution:**
The Vite config is set to `strictPort: false`, so it should automatically use a different port. If you still see this error:
```bash
# Kill the process using port 5173
lsof -ti:5173 | xargs kill -9

# Or manually specify a different port
npm run dev -- --port 5174
```

## Dependency Issues

### npm install fails or takes too long

**Solution:**
1. Clear npm cache:
   ```bash
   npm cache clean --force
   ```

2. Delete package-lock.json and try again:
   ```bash
   rm package-lock.json
   npm install
   ```

### Security vulnerabilities after npm install

**Symptoms:**
- `npm install` shows "X vulnerabilities" message

**Solution:**
1. Try automatic fix:
   ```bash
   npm audit fix
   ```

2. If that doesn't work, check if you can safely update:
   ```bash
   npm audit
   npm update
   ```

## Environment Configuration

### API keys not working

**Symptoms:**
- Features like AI feedback or ElevenLabs conversation don't work
- Console shows "API key not set" errors

**Solution:**
1. Make sure you have a `.env` file in the project root
2. Copy from the example: `cp .env.example .env`
3. Fill in your actual API keys in `.env`
4. Restart the development server

**Required environment variables:**
- `VITE_ELEVENLABS_AGENT_ID` - Your ElevenLabs agent ID
- `VITE_GEMINI_API_KEY` - Your Google Gemini API key
- `VITE_ELEVENLABS_API_KEY` - Your ElevenLabs API key (for audio analysis)

## WordPress Integration Issues

### App not loading in WordPress

**Symptoms:**
- Shortcode shows but React app doesn't render
- Console shows "Root element not found"

**Solution:**
1. Make sure the shortcode is correct: `[bewerbungstrainer_app]`
2. Check browser console for errors
3. Verify that the plugin is activated
4. Clear WordPress cache if using a caching plugin

## Helpful npm Scripts

The project includes several helpful scripts for common maintenance tasks:

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Cleaning
npm run clean        # Remove node_modules, dist, and .vite cache
npm run clean:cache  # Remove only build artifacts (dist, .vite)
npm run fresh        # Clean everything and reinstall dependencies
npm run rebuild      # Clean build artifacts and rebuild

# Quality
npm run lint         # Run ESLint
```

## Getting More Help

If you're still experiencing issues:

1. Check the [README.md](./README.md) for setup instructions
2. Check the [CLAUDE.md](./CLAUDE.md) for development guidelines
3. Review the browser console for error messages
4. Check the terminal output for build errors
5. Create an issue in the GitHub repository with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Node version, npm version)

## Common Commands Reference

```bash
# Check versions
node --version       # Should be v18 or higher
npm --version        # Should be v9 or higher

# View all available scripts
npm run

# Install a new dependency
npm install package-name

# Remove a dependency
npm uninstall package-name

# Update all dependencies (careful!)
npm update

# Check for outdated packages
npm outdated
```

## Prevention Tips

1. **Regular Cleanup:** Run `npm run clean:cache` periodically to avoid cache issues
2. **Keep Dependencies Updated:** Regularly check for and apply updates to dependencies
3. **Use .gitignore:** Never commit `node_modules`, `dist`, or `.env` files
4. **Fresh Install:** When pulling changes from git, run `npm install` to ensure dependencies are up to date
5. **Environment Variables:** Always use `.env` files, never hard-code API keys

---

**Last Updated:** 2025-11-24
