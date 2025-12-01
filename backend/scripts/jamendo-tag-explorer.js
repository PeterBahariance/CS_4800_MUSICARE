/**
 * Quick utility to inspect Jamendo tag coverage for various search queries.
 * Usage:
 *   node backend/scripts/jamendo-tag-explorer.js "lo-fi+chillhop+chill" "focus+instrumental+ambient" --limit 40
 *
 * Defaults target the Deep Focus / Lo-fi Therapy playlists so we can see which
 * tags Jamendo actually returns and adjust CATEGORY_CONFIG accordingly.
 */
import { searchTracks } from '../lib/jamendo.js';

const DEFAULT_QUERIES = [
  'lo-fi+chillhop+chill',
  'lofi+chillhop+chill',
  'focus+instrumental+ambient',
  'instrumental+study+ambient'
];

const { queries, limit } = parseArgs(process.argv.slice(2));

(async () => {
  for (const query of queries) {
    await inspectQuery(query, limit);
  }
})().catch(error => {
  console.error('🚨 Jamendo Tag Explorer failed:', error);
  process.exitCode = 1;
});

async function inspectQuery(query, limit) {
  console.log('\n========================================');
  console.log(`🔍 Query: tags=${query} (limit ${limit})`);

  try {
    const tracks = await searchTracks({ tags: query, limit });
    console.log(`🎵 Tracks returned: ${tracks.length}`);

    const tagCounts = new Map();
    const genreCounts = new Map();

    tracks.forEach(track => {
      collectValues(track.tags, tagCounts);
      collectValues(track.genres, genreCounts);
    });

    printTopCounts('Tags', tagCounts);
    printTopCounts('Genres', genreCounts);

    if (tracks[0]) {
      console.log('📝 Sample track:', `"${tracks[0].title}" by ${tracks[0].artist}`);
    }
  } catch (error) {
    console.error(`⚠️  Query failed for tags=${query}:`, error.message);
  }
}

function collectValues(source, bucket) {
  if (!source) return;

  if (Array.isArray(source)) {
    source.forEach(value => collectValues(value, bucket));
    return;
  }

  if (typeof source === 'object') {
    Object.values(source).forEach(value => collectValues(value, bucket));
    return;
  }

  if (typeof source === 'string') {
    const normalized = source.trim().toLowerCase();
    if (!normalized) return;
    bucket.set(normalized, (bucket.get(normalized) || 0) + 1);
  }
}

function printTopCounts(label, bucket, maxItems = 15) {
  if (!bucket.size) {
    console.log(`• ${label}: (none)`);
    return;
  }

  const sorted = [...bucket.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxItems);

  console.log(`• ${label}:`);
  sorted.forEach(([value, count]) => {
    console.log(`    - ${value}: ${count}`);
  });
}

function parseArgs(args) {
  const queries = [];
  let limit = 40;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--limit' && args[i + 1]) {
      limit = Number(args[i + 1]) || limit;
      i += 1;
      continue;
    }
    if (arg.startsWith('--')) {
      continue;
    }
    queries.push(arg);
  }

  return {
    queries: queries.length ? queries : DEFAULT_QUERIES,
    limit
  };
}

