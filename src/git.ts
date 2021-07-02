import {exec} from '@actions/exec'

export const splitFileNames = (str: string): string[] => {
  return str.split('\n').map(s =>
    s
      .trim()
      .split(/ +/)
      .filter((_, idx) => idx > 4)
      .join(' ')
  )
}

interface DiffIndexResponse {
  exitCode: number
  files?: string[]
}

export async function diffIndex(): Promise<DiffIndexResponse> {
  let diffIndexOutput = ''

  const exitCode = await exec('git', ['diff-index', '--quiet', 'HEAD', '--'], {
    listeners: {
      stdout: (data: Buffer) => {
        diffIndexOutput += data.toString()
      }
    }
  })

  if (exitCode === 0) {
    return {
      exitCode
    }
  }

  const files = splitFileNames(diffIndexOutput)

  return {
    exitCode,
    files
  }
}
