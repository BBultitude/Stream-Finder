import PropTypes from 'prop-types'

export const streamingEntryShape = PropTypes.shape({
  name: PropTypes.string,
  logo: PropTypes.string,
  isNew: PropTypes.bool,
})

export const castMemberShape = PropTypes.shape({
  id: PropTypes.number,
  name: PropTypes.string,
  character: PropTypes.string,
  profile_path: PropTypes.string,
})

export const itemShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  media_type: PropTypes.oneOf(['movie', 'tv']).isRequired,
  title: PropTypes.string,
  name: PropTypes.string,
  poster_path: PropTypes.string,
  overview: PropTypes.string,
  vote_average: PropTypes.number,
  release_date: PropTypes.string,
  first_air_date: PropTypes.string,
  display_status: PropTypes.string,
  streaming: PropTypes.arrayOf(streamingEntryShape),
  genre_ids: PropTypes.arrayOf(PropTypes.number),
  runtime: PropTypes.number,
  number_of_seasons: PropTypes.number,
  number_of_episodes: PropTypes.number,
  certification: PropTypes.string,
  trailer_key: PropTypes.string,
  imdb_id: PropTypes.string,
  cast: PropTypes.arrayOf(castMemberShape),
})
