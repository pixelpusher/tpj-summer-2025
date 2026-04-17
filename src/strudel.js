
/**
 * Parses a basic Strudel/TidalCycles mini-notation string into a 2D array. 
 * @param {String} pattern 
 * @param {Number} totalBeats 
 * @returns {Array} 2D array in liveprinter notation
 */
export function parseStrudel(pattern, totalBeats = 4) {
    const expandedPattern = pattern.replace(/([^\s\[\]]+)!(\d+)/g, (match, note, count) => {
        return Array(parseInt(count, 10)).fill(note).join(' ');
    });
    
    const tokens = expandedPattern.match(/\[|\]|[^\s\[\]]+/g);
    if (!tokens) return [];
    
    const root = [];
    const stack = [root];
    
    for (const token of tokens) {
        if (token === '[') {
            const newList = [];
            stack[stack.length - 1].push(newList);
            stack.push(newList);
        } else if (token === ']') {
            if (stack.length > 1) stack.pop();
        } else {
            stack[stack.length - 1].push(token);
        }
    }
    
    function toFractionStr(decimal) {
        if (Number.isInteger(decimal)) return decimal + 'b';
        for (let d = 2; d <= 64; d *= 2) {
            let n = Math.round(decimal * d);
            if (Math.abs(decimal - n / d) < 0.001) return n === 1 ? `1/${d}b` : `${n}/${d}b`;
        }
        return decimal.toFixed(3).replace(/\.?0+$/, '') + 'b'; 
    }
    
    const result = [];
    
    function traverse(node, allocatedDuration) {
        if (Array.isArray(node)) {
            let totalWeight = 0;
            const parsedChildren = node.map(child => {
                let weight = 1; 
                if (typeof child === 'string') {
                    if (child.includes('@')) {
                        weight = parseFloat(child.split('@')[1]) || 1;
                    } else if (child.includes('/')) {
                        weight = parseFloat(child.split('/')[1]) || 1; 
                    }
                }
                totalWeight += weight;
                return { child, weight };
            });
            
            for (const { child, weight } of parsedChildren) {
                const childDuration = allocatedDuration * (weight / totalWeight);
                traverse(child, childDuration);
            }
        } else {
            let noteName = node;
            let duration = allocatedDuration;
            
            if (noteName.includes('@')) noteName = noteName.split('@')[0];
            if (noteName.includes('/')) noteName = noteName.split('/')[0];
            
            if (noteName.includes('*')) {
                const [rawNote, multStr] = noteName.split('*');
                const cleanNote = rawNote === '~' ? '-' : rawNote;
                const multiplier = parseInt(multStr, 10);
                
                if (!isNaN(multiplier) && multiplier > 0) {
                    const stepDuration = duration / multiplier;
                    const durationStr = toFractionStr(stepDuration);
                    for (let i = 0; i < multiplier; i++) {
                        result.push([cleanNote, durationStr]);
                    }
                    return;
                }
            }
            
            const finalNote = noteName === '~' ? '-' : noteName;
            result.push([finalNote, toFractionStr(duration)]);
        }
    }
    
    traverse(root, totalBeats);
    return result;
}

// ==========================================
// TEST FRAMEWORK
// ==========================================

/**
* Runs a single test case, comparing actual parser output to expected output.
* @param {string} testName - A description of what the test is verifying.
* @param {string} pattern - The Strudel pattern to parse.
* @param {number} totalBeats - The duration context for the pattern.
* @param {Array[]} expectedOutput - The array we expect the parser to generate.
*/
export function runTest(testName, pattern, totalBeats, expectedOutput) {
    const actualOutput = parseStrudel(pattern, totalBeats);
    
    // Use JSON.stringify for deep array comparison
    const passed = JSON.stringify(actualOutput) === JSON.stringify(expectedOutput);
    
    console.log(`--- Test: ${testName} ---`);
    if (passed) {
        console.log(`✅ PASSED\n`);
    } else {
        console.log(`❌ FAILED`);
        console.log(`Pattern: "${pattern}"`);
        console.log(`Expected:`, expectedOutput);
        console.log(`Actual:  `, actualOutput);
        console.log(`\n`);
    }
}

// ==========================================
// TEST SUITE
// ==========================================

export function test()
{
    console.log("Running Strudel Parser Tests...\n");
    
    // Test 1: Standard subdivisions and rests
    runTest(
        "Basic Subdivisions and Rests",
        "[bd ~] [sd bd]", 
        4, // 4 beats total (2 root groups, 2 beats each)
        [
            ['bd', '1b'], ['-', '1b'], 
            ['sd', '1b'], ['bd', '1b']
        ]
    );
    
    // Test 2: Multipliers (*)
    runTest(
        "Multipliers (*)",
        "[hh*4]", 
        1, // 1 beat total divided by 4 hi-hats
        [
            ['hh', '1/4b'], ['hh', '1/4b'], ['hh', '1/4b'], ['hh', '1/4b']
        ]
    );
    
    // Test 3: Replication (!)
    // Replication creates literal copies of the note in the array before structural parsing
    runTest(
        "Replication (!)",
        "bd!3", 
        3, // 3 beats total, meaning each of the 3 replicated kicks gets 1 beat
        [
            ['bd', '1b'], ['bd', '1b'], ['bd', '1b']
        ]
    );
    
    // Test 4: Elongation (@)
    // Elongation steals relative time inside a bracketed group
    runTest(
        "Elongation (@)",
        "[bd@3 sn]", 
        4, // 4 beats total. bd gets weight 3, sn gets weight 1 (total weight 4)
        [
            ['bd', '3b'], ['sn', '1b']
        ]
    );
    
    // Test 5: Division (/)
    // Division slows down a step, acting identically to elongation in terms of relative weight
    runTest(
        "Division (/)",
        "[bd/2 sn]", 
        3, // 3 beats total. bd gets weight 2, sn gets weight 1 (total weight 3)
        [
            ['bd', '2b'], ['sn', '1b']
        ]
    );
    
    // Test 6: Complex nested combination
    runTest(
        "Complex Nesting and Operations",
        "[[bd sn] hh*2] ~",
        2, // 2 beats total. Group 1 gets 1 beat, Rest gets 1 beat.
        [
            // Group 1 (1 beat total) -> splits into two half-beats
            ['bd', '1/4b'], ['sn', '1/4b'], // [bd sn] splits the 1/2 beat into two 1/4 beats
            ['hh', '1/4b'], ['hh', '1/4b'], // hh*2 splits the 1/2 beat into two 1/4 beats
            
            // Group 2
            ['-', '1b'] // Rest gets 1 full beat
        ]
    );
}

