<!-- @format -->

# Ear-Thereum

A small experimental project to test the idea of uploading delta encoded audio samples to an EVM based chain to build up a sample repository

# Immutatunes

The react frontend to this project geared towards uploading songs which utilise the samples from the sample repository

## Bit more detail

I'm taking FastTracker XM files (Extended Module), separating the sample data from the song data, compressing each sample and the song individually and storing them in a map keyed by the hash of the compressed bytes. This in effect will build up a sample repository which other artists can use in their songs without the need to reupload the samples for existing tunes.
