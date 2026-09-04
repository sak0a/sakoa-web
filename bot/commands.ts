import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type Client,
} from 'discord.js'

export const slashCommandDefinitions = [
  new SlashCommandBuilder()
    .setName('server-status')
    .setDescription('Show the current TF2 dodgeball server status')
    .addStringOption(option => option
      .setName('server')
      .setDescription('Show one configured server')
      .setMaxLength(64)
      .setRequired(false)),
  new SlashCommandBuilder()
    .setName('refresh-server-status')
    .setDescription('Refresh the managed TF2 server status messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option => option
      .setName('server')
      .setDescription('Refresh one configured server')
      .setMaxLength(64)
      .setRequired(false)),
].map(command => command.toJSON())

export async function registerGuildCommands(client: Client, guildId: string): Promise<void> {
  if (!client.application) throw new Error('Discord application is not ready')
  await client.application.commands.set(slashCommandDefinitions, guildId)
}
