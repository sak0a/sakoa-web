import { getDiscordRepository } from '../../../utils/discord-admin'

export default defineEventHandler(async () => {
  const repository = await getDiscordRepository()
  const [settings, runtime, jobs, jobCounts, messages, servers] = await Promise.all([
    repository.getSettings(),
    repository.getRuntime(),
    repository.listRecentJobs(20),
    repository.getJobCounts(),
    repository.listStatusMessages(),
    repository.listPublishableServers(),
  ])

  return {
    success: true,
    data: { settings, runtime, jobs, jobCounts, messages, servers },
  }
})
