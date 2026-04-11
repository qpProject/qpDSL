export function test(f : (s : string) => any){
    //some light custom CLI to continuously auto test user input
    // commented out since the basic test errors
    const readline = require("readline").createInterface({
        input : process.stdin,
        output : process.stdout
    })
    const quitCommands = ["exit", "quit", "q", "--q", "-q", "end", "stop", "cls"]

    readline.setPrompt("Enter a QPDSL sentence (or 'exit' to quit): ")

    readline.on('line', (input : string) => {
        const trimmedInput = input.trim().toLowerCase()
        if(quitCommands.includes(trimmedInput)){
            if(trimmedInput === "cls"){
                console.clear()
            }
            readline.close()
            return;
        }
        const result = f(input)
        console.dir(result, { depth : 20 })
        console.log("")
        readline.prompt()
    })

    readline.prompt()
}