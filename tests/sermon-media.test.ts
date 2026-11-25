import { describe, expect, it } from 'vitest'
import { parseYouTubeStart, youtubeEmbedUrl } from '../src/components/sermons/media'

describe('parseYouTubeStart', () => {
  it('reads the livestream offset stored on sermon URLs', () => {
    expect(parseYouTubeStart('https://www.youtube.com/embed/T4Tzlc3fPqw?start=3246')).toBe(3246)
    expect(parseYouTubeStart('https://youtu.be/T4Tzlc3fPqw?t=3246s')).toBe(3246)
    expect(parseYouTubeStart('https://www.youtube.com/watch?v=T4Tzlc3fPqw&t=54m6s')).toBe(3246)
  })

  it('returns null when there is no usable offset', () => {
    expect(parseYouTubeStart('https://www.youtube.com/embed/7JtoK4atVNQ?si=5x7J0R717WlF40Ye')).toBeNull()
    expect(parseYouTubeStart('https://www.youtube.com/embed/T4Tzlc3fPqw?start=abc')).toBeNull()
    expect(parseYouTubeStart('https://www.youtube.com/embed/T4Tzlc3fPqw?start=0')).toBeNull()
    expect(parseYouTubeStart(null)).toBeNull()
  })
})

describe('youtubeEmbedUrl', () => {
  it('adds start only when there is one', () => {
    expect(youtubeEmbedUrl('T4Tzlc3fPqw', 3246)).toBe('https://www.youtube.com/embed/T4Tzlc3fPqw?start=3246')
    expect(youtubeEmbedUrl('T4Tzlc3fPqw', null)).toBe('https://www.youtube.com/embed/T4Tzlc3fPqw')
    expect(youtubeEmbedUrl('T4Tzlc3fPqw')).toBe('https://www.youtube.com/embed/T4Tzlc3fPqw')
  })
})
