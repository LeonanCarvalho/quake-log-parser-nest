import { Test, TestingModule } from '@nestjs/testing';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { Readable } from 'stream';

describe('MatchesController', () => {
  let controller: MatchesController;
  let service: MatchesService;

  const mockMatchesService = {
    processLogFile: jest.fn().mockResolvedValue({ message: 'Processed' }),
    findAll: jest.fn().mockResolvedValue([]),
    getMatchReport: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchesController],
      providers: [
        {
          provide: MatchesService,
          useValue: mockMatchesService,
        },
      ],
    }).compile();

    controller = module.get<MatchesController>(MatchesController);
    service = module.get<MatchesService>(MatchesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call processLogFile on file upload', async () => {
    const file: Express.Multer.File = {
      fieldname: 'logFile',
      originalname: 'test.log',
      encoding: '7bit',
      mimetype: 'text/plain',
      size: 123,
      buffer: Buffer.from('test'),
      stream: new Readable(),
      destination: '',
      filename: '',
      path: '',
    };

    await controller.uploadLogFile(file);
    expect(service.processLogFile).toHaveBeenCalledWith(file.buffer);
  });
});
