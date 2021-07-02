import { exec } from '@actions/exec'

export const splitFileNames = (lines: string[]): string[] => {
  return lines.map(s =>
    s
      .split('\t')[1]
  )
}

interface DiffIndexResponse {
  files?: string[]
}

export async function diffIndex(): Promise<DiffIndexResponse> {
  const rawLines: string[] = [];

  await exec('git', ['diff-index', 'HEAD', '--'], {
    listeners: {
      stdline: (data) => {
        rawLines.push(data);
      },
      errline: (data) => {
        rawLines.push(data);
      }
    }
  })

  console.log(rawLines);
  const files = splitFileNames(rawLines)

  return {
    files
  }
}
