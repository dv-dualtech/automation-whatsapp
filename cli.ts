// cli.ts
import { parse } from "https://deno.land/std@0.211.0/flags/mod.ts";
import { WhatsAppAutomation } from "./whatsapp_automation.ts";

const helpText = `
WhatsApp Web Automation CLI

USAGE:
  deno run --allow-net --allow-read --allow-write --allow-env --allow-run cli.ts [COMMAND] [OPTIONS]

COMMANDS:
  init                Initialize WhatsApp Web session
  send               Send messages to contacts

OPTIONS:
  -h, --help         Show this help message
  -m, --message      Message to send
  -c, --contacts     Comma-separated list of contacts
  -f, --file         Path to file containing contacts (one per line)

EXAMPLES:
  # Initialize WhatsApp Web session
  deno run --allow-net --allow-read --allow-write --allow-env --allow-run cli.ts init

  # Send a message to specific contacts
  deno run --allow-net --allow-read --allow-write --allow-env --allow-run cli.ts send -m "Hello!" -c "John Doe,Jane Smith"

  # Send a message to contacts from a file
  deno run --allow-net --allow-read --allow-write --allow-env --allow-run cli.ts send -m "Hello!" -f contacts.txt
`;

async function main() {
  const args = parse(Deno.args, {
    string: ["message", "contacts", "file"],
    alias: {
      h: "help",
      m: "message",
      c: "contacts",
      f: "file",
    },
  });

  if (args.help) {
    console.log(helpText);
    Deno.exit(0);
  }

  const command = args._[0];
  if (!command) {
    console.error("Please provide a command (init or send)");
    console.log(helpText);
    Deno.exit(1);
  }

  const whatsapp = new WhatsAppAutomation({
    messageDelay: 2000,
    maxRetries: 3,
  });

  try {
    switch (command) {
      case "init": {
        console.log("Initializing WhatsApp Web...");
        await whatsapp.initialize();
        console.log("Session initialized successfully!");
        break;
      }

      case "send": {
        if (!args.message) {
          console.error("Please provide a message using -m or --message");
          Deno.exit(1);
        }

        let contacts: string[] = [];

        if (args.file) {
          try {
            const fileContent = await Deno.readTextFile(args.file);
            contacts = fileContent
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line.length > 0);
          } catch (error: unknown) {
            if (error instanceof Error) {
              console.error("Error reading contacts file:", error.message);
            } else {
              console.error("Error reading contacts file: Unknown error");
            }
            Deno.exit(1);
          }
        } else if (args.contacts) {
          contacts = args.contacts.split(",").map((c: string) => c.trim());
        } else {
          console.error(
            "Please provide contacts either via --contacts or --file",
          );
          Deno.exit(1);
        }

        console.log("Initializing WhatsApp Web...");
        await whatsapp.initialize();

        console.log(`Sending message to ${contacts.length} contact(s)...`);
        await whatsapp.sendBulkMessages(contacts, args.message);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.log(helpText);
        Deno.exit(1);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Error: An unknown error occurred");
    }
    Deno.exit(1);
  } finally {
    await whatsapp.close();
  }
}

if (import.meta.main) {
  main();
}
