import express from 'express';
import Movie from '../models/Movie.js';

const router = express.Router();

// GET all movies
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json({ success: true, data: movies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single movie
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }
    res.json({ success: true, data: movie });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST new movie
router.post('/', async (req, res) => {
  try {
    const { title, description, image } = req.body;
    
    if (!title || !description || !image) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const movie = new Movie({
      title,
      description,
      image
    });

    const newMovie = await movie.save();
    res.status(201).json({ success: true, data: newMovie });
  } catch (error) {
    console.error('Create movie error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE movie
router.delete('/:id', async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }
    res.json({ success: true, message: 'Movie deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE movie
router.put('/:id', async (req, res) => {
  try {
    const updatedMovie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedMovie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }
    res.json({ success: true, data: updatedMovie });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;