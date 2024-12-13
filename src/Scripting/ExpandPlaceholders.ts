import Mustache from 'mustache';
import proxyData from 'mustache-validator';

// https://github.com/janl/mustache.js

/**
 * Expand any placeholder strings - {{....}} - in the given template, and return the result.
 *
 * The template implementation is currently provided by: [mustache.js](https://github.com/janl/mustache.js).
 *
 * @param template - A template string, typically with placeholders such as {{query.task.folder}}
 * @param view - The property values
 *
 * @throws Error
 *
 *      By using mustache-validator's proxyData, we ensure that any accesses of property names that are
 *      not in the view, we ensure that errors are detected immediately.
 *      The first unknown placeholder is included in Error.message.
 */
export function expandPlaceholders(template: string, view: any): string {
    // Turn off HTML escaping of things like '/' in file paths:
    // https://github.com/janl/mustache.js#variables
    Mustache.escape = function (text) {
        return text;
    };

    // Regex to detect function calls in placeholders
    const functionRegex = /{{\s*([\w.]+)\(([^)]*)\)\s*}}/g;

    // Preprocess the template to evaluate any placeholders that involve function calls
    const evaluatedTemplate = template.replace(functionRegex, (_match, functionPath, args) => {
        // Split the function path (e.g., "query.file.property") into parts
        const pathParts = functionPath.split('.');
        // Extract the function name (last part of the path)
        const functionName = pathParts.pop();
        // Traverse the view object to find the object containing the function
        const obj = pathParts.reduce((acc: any, part: any) => acc?.[part], view);

        // Check if the function exists on the resolved object
        if (obj && typeof obj[functionName] === 'function') {
            // Parse the arguments from the placeholder, stripping quotes and trimming whitespace
            // ^['"]: Removes quotes from the start of the string.
            // ['"]$: Removes quotes from the end of the string.
            const argValues = parseArgs(args);

            // Call the function with the parsed arguments and return the result
            return obj[functionName](...argValues);
        }

        // Throw an error if the function does not exist or is invalid
        throw new Error(`Unknown property or invalid function: ${functionPath}`);
    });

    // Render the preprocessed template
    try {
        return Mustache.render(evaluatedTemplate, proxyData(view));
    } catch (error) {
        let message = '';
        if (error instanceof Error) {
            message = `There was an error expanding one or more placeholders.

The error message was:
    ${error.message.replace(/ > /g, '.').replace('Missing Mustache data property', 'Unknown property')}`;
        } else {
            message = 'Unknown error expanding placeholders.';
        }
        message += `

The problem is in:
    ${template}`;
        throw Error(message);
    }
}

function parseArgs(args: string): string[] {
    const argRegex = new RegExp(
        [
            // Match single-quoted arguments
            "'((?:\\\\'|[^'])*)'",

            // Match double-quoted arguments
            '"((?:\\\\"|[^"])*)"',

            // Match unquoted arguments (non-commas)
            '([^,]+)',
        ].join('|'), // Combine all parts with OR (|)
        'g', // Global flag for multiple matches
    );

    const parsedArgs: string[] = [];
    let match;

    while ((match = argRegex.exec(args)) !== null) {
        if (match[1] !== undefined) {
            // Single-quoted argument
            parsedArgs.push(match[1].replace(/\\'/g, "'"));
        } else if (match[2] !== undefined) {
            // Double-quoted argument
            parsedArgs.push(match[2].replace(/\\"/g, '"'));
        } else if (match[3] !== undefined) {
            // Unquoted argument
            parsedArgs.push(match[3].trim());
        }
    }

    return parsedArgs;
}
