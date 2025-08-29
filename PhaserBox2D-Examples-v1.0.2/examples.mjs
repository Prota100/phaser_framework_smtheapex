import esbuild from 'esbuild';
import fs from 'fs/promises';

async function startServer ()
{
    try
    {
        await fs.access('examples/lib/PhaserBox2D.js');

        const ctx = await esbuild.context({});

        const { host, port } = await ctx.serve({
            servedir: 'examples'
        });

        console.log(`Phaser Box2D Examples Server running at http://localhost:${port}`);
    }
    catch (err)
    {
        if (err.code === 'ENOENT')
        {
            console.error('The file "examples/lib/PhaserBox2D.js" does not exist.');
            console.error('Login to your Phaser account to download it. See README.md for details.');
        }
        else
        {
            console.error('An error occurred:', err);
        }
    }
}

startServer().catch((err) => {
    console.error('Failed to start the server:', err);
});
