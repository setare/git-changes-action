import {splitFileNames} from '../src/git'

test('split files from git diff', () => {
  const files = splitFileNames([' M file1', ' M file2'])
  expect(files.length).toBe(2)
  expect(files).toEqual(['file1', 'file2'])
})

test('git diff', async () => {
  /*
  const d = await diffIndex();
  expect(d).toEqual({
    files: ['__tests__/git.test.ts', 'src/git.ts']
  })
  */
})
