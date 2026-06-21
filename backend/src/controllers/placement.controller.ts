import { Request, Response, NextFunction } from 'express';
import { getPlacementOverview, getStudentDetail, getColleges } from '../services/placement.service.js';

export async function getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const college = req.query.college as string | undefined;
    const overview = await getPlacementOverview(college);
    res.json({ success: true, data: overview });
  } catch (error) {
    next(error);
  }
}

export async function getCollegesList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const colleges = await getColleges();
    res.json({ success: true, data: colleges });
  } catch (error) {
    next(error);
  }
}

export async function getStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const detail = await getStudentDetail(String(req.params.userId));
    if (!detail) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }
    res.json({ success: true, data: detail });
  } catch (error) {
    next(error);
  }
}
